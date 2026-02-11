
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Bike, Sale, Container } from '../types';
import { Search, MapPin, Phone, User, Calendar, CreditCard, FileText, X, ChevronRight, Printer, Filter, ShoppingCart, Save } from 'lucide-react';

interface Props {
  customers: Customer[];
  stock: Bike[];
  sales: Sale[];
  containers: Container[];
  onPurchaseMore: (customer: Customer) => void;
  onUpdateBikeReg: (bikeId: string, regNumber: string) => void;
  onUpdateCustomerNotes: (customerId: string, notes: string) => void;
}

// Comprehensive specs map with lowercase keys for flexible matching
const BIKE_SPECS: Record<string, { cc: string, laden: string, unladen: string, seat: string }> = {
  'r15m': { cc: '155 cc', laden: '282 kg', unladen: '142 kg', seat: '2 Persons' },
  'r15': { cc: '155 cc', laden: '282 kg', unladen: '142 kg', seat: '2 Persons' },
  'mt-15': { cc: '155 cc', laden: '280 kg', unladen: '139 kg', seat: '2 Persons' },
  'mt 15': { cc: '155 cc', laden: '280 kg', unladen: '139 kg', seat: '2 Persons' },
  'ray zr': { cc: '125 cc', laden: '250 kg', unladen: '99 kg', seat: '2 Persons' },
  'rayzr': { cc: '125 cc', laden: '250 kg', unladen: '99 kg', seat: '2 Persons' },
  'aerox': { cc: '155 cc', laden: '276 kg', unladen: '126 kg', seat: '2 Persons' },
  'burgman': { cc: '125 cc', laden: '270 kg', unladen: '110 kg', seat: '2 Persons' },
  'adv 160': { cc: '160 cc', laden: '290 kg', unladen: '133 kg', seat: '2 Persons' },
  'adv160': { cc: '160 cc', laden: '290 kg', unladen: '133 kg', seat: '2 Persons' },
};

const getSpecs = (model: string) => {
  const modelLower = model.toLowerCase();
  
  // Sort keys by length descending to match longest specific string first (e.g. match 'r15m' before 'r15')
  const keys = Object.keys(BIKE_SPECS).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    if (modelLower.includes(key)) {
      return BIKE_SPECS[key];
    }
  }
  
  return { cc: 'N/A', laden: 'N/A', unladen: 'N/A', seat: '2 Persons' };
};

const CustomersTab: React.FC<Props> = ({ customers, stock, sales, containers, onPurchaseMore, onUpdateBikeReg, onUpdateCustomerNotes }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // Format: YYYY-MM
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [regInput, setRegInput] = useState<Record<string, string>>({});
  const [notesInput, setNotesInput] = useState('');

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const terms = q.split(/\s+/).filter(t => t.length > 0);
    
    return customers.filter(c => {
      // Date Filter
      if (dateFilter) {
        const hasSaleInMonth = c.purchasedBikeIds.some(bikeId => {
          const sale = sales.find(s => s.bikeId === bikeId);
          return sale?.saleDate.startsWith(dateFilter);
        });
        if (!hasSaleInMonth) return false;
      }

      if (terms.length === 0) return true;

      // Powerful Search Filter: Checks multiple fields and supports multiple terms (AND logic)
      const purchasedBikes = c.purchasedBikeIds.map(id => stock.find(b => b.id === id)).filter(Boolean) as Bike[];
      
      const customerText = [
        c.name,
        c.fatherName,
        c.motherName,
        c.phone,
        c.nid,
        c.address,
        c.notes
      ].join(' ').toLowerCase();

      const bikeText = purchasedBikes.map(b => [
        b.model,
        b.chassis,
        b.engine,
        b.color,
        b.registrationNumber || ''
      ].join(' ')).join(' ').toLowerCase();

      const fullSearchableText = `${customerText} ${bikeText}`;

      // Check if EVERY term in the search query exists in the full data text
      return terms.every(term => fullSearchableText.includes(term));
    });
  }, [customers, searchQuery, stock, dateFilter, sales]);

  const handlePrintBankSlip = (customer: Customer, bike: Bike) => {
    const sale = sales.find(s => s.bikeId === bike.id && s.customerId === customer.id);
    const saleDate = sale ? new Date(sale.saleDate).toLocaleDateString() : 'N/A';
    const dobFormatted = new Date(customer.dob).toLocaleDateString();
    const specs = getSpecs(bike.model);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bank Slip - ${customer.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header-container { display: flex; align-items: center; justify-content: center; gap: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 40px; }
            .header-text { text-align: left; }
            .header-text h1 { margin: 0; color: #4f46e5; font-size: 28px; text-transform: uppercase; font-weight: 900; }
            .header-text p { margin: 2px 0 0; color: #666; font-size: 14px; font-weight: 500; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; color: #4f46e5; border-left: 4px solid #4f46e5; padding-left: 10px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f9fafb; font-weight: bold; color: #374151; width: 35%; }
            .footer { margin-top: 100px; display: flex; justify-content: space-between; padding: 0 40px; }
            .sig-box { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 10px; font-size: 12px; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-container">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 20V80M25 20H45C55 20 60 25 60 35C60 45 55 50 45 50H25M40 50L65 80" stroke="#FF0000" stroke-width="10" stroke-linecap="square" stroke-linejoin="miter"/>
              <path d="M55 40H85M65 58H90M75 76H95" stroke="#0000FF" stroke-width="8" stroke-linecap="square"/>
            </svg>
            <div class="header-text">
              <h1>RYAN ENTERPRISE</h1>
              <p>Official Sales & Distribution Center</p>
              <p>Document Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="section-title">Customer Information</div>
          <table>
            <tr><th>Customer Name</th><td>${customer.name}</td></tr>
            <tr><th>Father's Name</th><td>${customer.fatherName}</td></tr>
            <tr><th>Mother's Name</th><td>${customer.motherName}</td></tr>
            <tr><th>Date of Birth</th><td>${dobFormatted}</td></tr>
            <tr><th>National ID (NID)</th><td>${customer.nid}</td></tr>
            <tr><th>Phone Number</th><td>${customer.phone}</td></tr>
            <tr><th>Permanent Address</th><td>${customer.address}</td></tr>
          </table>

          <div class="section-title">Vehicle Information</div>
          <table>
            <tr><th>Bike Model</th><td>${bike.model}</td></tr>
            <tr><th>Chassis Number</th><td>${bike.chassis}</td></tr>
            <tr><th>Engine Number</th><td>${bike.engine}</td></tr>
            <tr><th>Color</th><td>${bike.color}</td></tr>
            <tr><th>Seating Capacity</th><td>${specs.seat}</td></tr>
            <tr><th>Cubic Capacity (CC)</th><td>${specs.cc}</td></tr>
            <tr><th>Unladen Weight</th><td>${specs.unladen}</td></tr>
            <tr><th>Laden Weight</th><td>${specs.laden}</td></tr>
            <tr><th>Sale Date</th><td>${saleDate}</td></tr>
          </table>

          <div class="footer">
            <div class="sig-box">Customer Signature</div>
            <div class="sig-box">Authorized Manager Signature</div>
          </div>

          <div class="no-print" style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 12px 30px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">Print Now</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNotesInput(customer.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedCustomer) {
      onUpdateCustomerNotes(selectedCustomer.id, notesInput);
      setSelectedCustomer({ ...selectedCustomer, notes: notesInput });
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, phone, engine, chassis, NID..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bg-white px-4 flex items-center border border-gray-100 rounded-2xl shadow-sm min-w-[200px]">
          <Filter className="text-gray-400 mr-2" size={20} />
          <input 
            type="month"
            className="bg-transparent outline-none w-full text-gray-600 font-medium"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <button 
            key={customer.id}
            onClick={() => handleOpenCustomer(customer)}
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left"
          >
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-50">
                {customer.photo ? (
                  <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{customer.name}</h4>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Phone size={14} className="mr-1" />
                  {customer.phone}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {customer.purchasedBikeIds.slice(0, 2).map(id => {
                    const bike = stock.find(b => b.id === id);
                    return bike ? (
                      <span key={id} className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                        {bike.model}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-indigo-400 transition-colors self-center" size={20} />
            </div>
          </button>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400">
            <User className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg">No customers matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-50 w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            {/* Sidebar info */}
            <div className="w-full md:w-80 bg-white border-r border-gray-100 p-8 flex flex-col items-center">
              <div className="w-40 h-40 rounded-3xl bg-gray-100 shadow-inner overflow-hidden mb-6 border-4 border-white">
                {selectedCustomer.photo ? (
                  <img src={selectedCustomer.photo} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User size={80} />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-black text-gray-900 text-center leading-tight mb-2">{selectedCustomer.name}</h2>
              <p className="text-gray-400 font-medium mb-8">Customer ID: {selectedCustomer.id.split('-')[0]}</p>
              
              <div className="w-full space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Phone size={16} className="mr-3 text-indigo-500" />
                  <span className="font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Calendar size={16} className="mr-3 text-indigo-500" />
                  <span>DOB: {new Date(selectedCustomer.dob).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <CreditCard size={16} className="mr-3 text-indigo-500" />
                  <span>NID: {selectedCustomer.nid}</span>
                </div>
              </div>

              <button 
                 onClick={() => onPurchaseMore(selectedCustomer)}
                 className="w-full py-3 mb-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> Purchase More
              </button>

              <button 
                onClick={() => setSelectedCustomer(null)}
                className="mt-auto w-full py-3 border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Close Profile
              </button>
            </div>

            {/* Main scrollable content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-8">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                    <FileText size={16} className="mr-2" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 mb-1">Father's Name</p>
                      <p className="font-bold text-gray-800">{selectedCustomer.fatherName}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 mb-1">Mother's Name</p>
                      <p className="font-bold text-gray-800">{selectedCustomer.motherName}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 col-span-2">
                      <p className="text-xs font-bold text-gray-400 mb-1 flex items-center">
                        <MapPin size={12} className="mr-1" /> Permanent Address
                      </p>
                      <p className="font-medium text-gray-700 leading-relaxed">{selectedCustomer.address}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                    <BoxIcon className="mr-2" size={16} />
                    Purchase History
                  </h3>
                  <div className="space-y-4">
                    {selectedCustomer.purchasedBikeIds.map(bikeId => {
                      const bike = stock.find(b => b.id === bikeId);
                      const container = bike?.containerId ? containers.find(c => c.id === bike.containerId) : null;
                      const sale = sales.find(s => s.bikeId === bikeId);
                      const displayExporter = bike?.exporterName || container?.exporterName;
                      
                      return bike ? (
                        <div key={bikeId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="font-black text-indigo-900 text-xl">{bike.model}</p>
                                <p className="text-sm font-mono text-gray-500 mt-1">Chassis: {bike.chassis}</p>
                                <p className="text-sm font-mono text-gray-500">Engine: {bike.engine}</p>
                                <p className="text-sm font-mono text-gray-500">Color: {bike.color}</p>
                                
                                {displayExporter && (
                                   <p className="text-xs font-bold text-gray-500 uppercase mt-2">
                                     Exporter: <span className="text-indigo-600">{displayExporter}</span>
                                   </p>
                                )}

                                {container && (
                                   <span className="inline-block mt-2 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded">
                                     Shipment: {container.name}
                                   </span>
                                )}
                             </div>
                             <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-2 uppercase">Verified Purchase</span>
                                {sale && (
                                  <div className="mt-2 text-right">
                                    <p className="text-xs font-bold text-gray-500 uppercase">
                                      Reg Type: <span className="text-gray-900">{sale.registrationDuration}</span>
                                    </p>
                                  </div>
                                )}
                             </div>
                          </div>
                          
                          {/* Registration Input */}
                          <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Reg No:</span>
                            <input 
                              type="text"
                              className="bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none w-full font-mono text-sm"
                              placeholder={bike.registrationNumber || "Enter Registration Number"}
                              value={regInput[bikeId] ?? bike.registrationNumber ?? ''}
                              onChange={(e) => setRegInput(prev => ({...prev, [bikeId]: e.target.value}))}
                            />
                            {(regInput[bikeId] !== undefined && regInput[bikeId] !== (bike.registrationNumber || '')) && (
                              <button 
                                onClick={() => onUpdateBikeReg(bikeId, regInput[bikeId])}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <Save size={18} />
                              </button>
                            )}
                          </div>

                          <div className="flex justify-end pt-4 border-t border-gray-100">
                             <button 
                                onClick={() => handlePrintBankSlip(selectedCustomer, bike)}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                              >
                                <Printer size={16} />
                                <span>Print Bank Slip</span>
                              </button>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText size={16} className="mr-2" />
                      Internal Notes
                    </div>
                    <button 
                      onClick={handleSaveNotes}
                      className="text-xs normal-case bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <Save size={12} /> Save
                    </button>
                  </h3>
                  <textarea
                    className="w-full bg-indigo-900/5 p-6 rounded-2xl border border-indigo-900/10 text-indigo-900/70 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    rows={4}
                    placeholder="Add notes here..."
                  />
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BoxIcon: React.FC<{ size?: number, className?: string }> = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);

export default CustomersTab;
