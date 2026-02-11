
import React, { useState } from 'react';
import { Bike, Customer, Sale } from '../types';
import { Search, ShoppingBag, History, User, CreditCard, ChevronRight, Check } from 'lucide-react';

interface Props {
  stock: Bike[];
  sales: Sale[];
  customers: Customer[];
  onProcessSale: (bikeId: string, customerData: Omit<Customer, 'id' | 'purchasedBikeIds'>, salePrice: number, regDuration: '2 years' | '10 years') => void;
  preSelectedCustomer?: Customer | null;
}

const SalesTab: React.FC<Props> = ({ stock, sales, customers, onProcessSale, preSelectedCustomer }) => {
  const [view, setView] = useState<'new' | 'history'>('new');
  const [chassisSearch, setChassisSearch] = useState('');
  const [foundBike, setFoundBike] = useState<Bike | null>(null);
  
  // Customer Form State
  const [customerData, setCustomerData] = useState({
    name: preSelectedCustomer?.name || '',
    fatherName: preSelectedCustomer?.fatherName || '',
    motherName: preSelectedCustomer?.motherName || '',
    phone: preSelectedCustomer?.phone || '',
    nid: preSelectedCustomer?.nid || '',
    dob: preSelectedCustomer?.dob || '',
    photo: preSelectedCustomer?.photo || (null as string | null),
    address: preSelectedCustomer?.address || '',
    notes: preSelectedCustomer?.notes || ''
  });
  const [salePrice, setSalePrice] = useState(0);
  const [regDuration, setRegDuration] = useState<'2 years' | '10 years'>('2 years');

  const handleChassisSearch = () => {
    const bike = stock.find(b => b.chassis === chassisSearch && b.status === 'available');
    if (bike) {
      setFoundBike(bike);
    } else {
      alert("No available bike found with this chassis number.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomerData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBike) return;
    onProcessSale(foundBike.id, customerData, salePrice, regDuration);
    // Reset
    setFoundBike(null);
    setChassisSearch('');
    setCustomerData({ name: '', fatherName: '', motherName: '', phone: '', nid: '', dob: '', photo: null, address: '', notes: '' });
    setSalePrice(0);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        <button 
          onClick={() => setView('new')}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-bold transition-all ${view === 'new' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ShoppingBag size={18} />
          <span>New Sale</span>
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-bold transition-all ${view === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <History size={18} />
          <span>Sales History</span>
        </button>
      </div>

      {view === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Search size={20} className="mr-2 text-indigo-500" />
                Find Bike
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Enter Chassis Number..." 
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase font-mono"
                    value={chassisSearch}
                    onChange={(e) => setChassisSearch(e.target.value)}
                  />
                  <button 
                    onClick={handleChassisSearch}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Lookup
                  </button>
                </div>
                
                {foundBike && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase">Selected Model</span>
                      <Check size={16} className="text-indigo-600" />
                    </div>
                    <p className="text-lg font-bold text-indigo-900">{foundBike.model}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="text-gray-500">Engine: <span className="font-bold text-gray-700">{foundBike.engine}</span></div>
                      <div className="text-gray-500">Color: <span className="font-bold text-gray-700">{foundBike.color}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <h3 className="font-bold mb-4 flex items-center">
                <CreditCard size={20} className="mr-2" />
                Pricing & Registration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold opacity-70 uppercase mb-1">Final Sale Price (৳)</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white focus:text-gray-900 outline-none transition-all"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold opacity-70 uppercase mb-2">Registration Duration</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegDuration('2 years')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${regDuration === '2 years' ? 'bg-white text-indigo-600 border-white' : 'bg-transparent border-white/30 text-white hover:bg-white/10'}`}
                    >
                      2 Years
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegDuration('10 years')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${regDuration === '10 years' ? 'bg-white text-indigo-600 border-white' : 'bg-transparent border-white/30 text-white hover:bg-white/10'}`}
                    >
                      10 Years
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <span className="text-sm">Total Receivable</span>
                  <span className="text-2xl font-bold">৳{salePrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <User size={20} className="mr-2 text-indigo-500" />
              Customer Information
            </h3>
            <form onSubmit={handleSubmitSale} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer Full Name</label>
                  <input required value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Father's Name</label>
                  <input required value={customerData.fatherName} onChange={e => setCustomerData({...customerData, fatherName: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mother's Name</label>
                  <input required value={customerData.motherName} onChange={e => setCustomerData({...customerData, motherName: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label>
                  <input required type="tel" value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">National ID (NID)</label>
                  <input required value={customerData.nid} onChange={e => setCustomerData({...customerData, nid: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                  <input required type="date" value={customerData.dob} onChange={e => setCustomerData({...customerData, dob: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer Photo</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Address</label>
                  <textarea rows={2} value={customerData.address} onChange={e => setCustomerData({...customerData, address: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notes / Remarks</label>
                  <textarea rows={2} value={customerData.notes} onChange={e => setCustomerData({...customerData, notes: e.target.value})} className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
              </div>

              <button 
                disabled={!foundBike}
                type="submit"
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${!foundBike ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
              >
                Complete Sale & Record
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Model & Chassis</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Reg</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.slice().reverse().map(sale => {
                const customer = customers.find(c => c.id === sale.customerId);
                const bike = stock.find(b => b.id === sale.bikeId);
                return (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{customer?.name}</div>
                      <div className="text-xs text-gray-500">{customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-indigo-700">{bike?.model}</div>
                      <div className="text-xs font-mono text-gray-400">{bike?.chassis}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ৳{sale.salePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.registrationDuration}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-gray-400 italic">Record saved</span>
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No historical sales data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesTab;
