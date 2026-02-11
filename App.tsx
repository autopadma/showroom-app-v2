
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Box, ShoppingCart, Users, Package } from 'lucide-react';
import { Bike, Customer, Sale, Container, AppTab } from './types';
import StockTab from './components/StockTab';
import SalesTab from './components/SalesTab';
import CustomersTab from './components/CustomersTab';
import DashboardTab from './components/DashboardTab';
import ContainersTab from './components/ContainersTab';
import Login from './components/Login';
import Logo from './components/Logo';

const INITIAL_STOCK: Bike[] = [
  { id: '1', model: 'Honda Hornet', chassis: 'CHAS101', engine: 'ENG101', color: 'Matte Blue', status: 'available' },
  { id: '2', model: 'Yamaha R15 V4', chassis: 'CHAS102', engine: 'ENG102', color: 'Racing Blue', status: 'available' },
  { id: '3', model: 'Suzuki Gixxer SF', chassis: 'CHAS103', engine: 'ENG103', color: 'Glass Sparkle Black', status: 'available' },
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [preSelectedCustomer, setPreSelectedCustomer] = useState<Customer | null>(null);
  
  // Data State
  const [stock, setStock] = useState<Bike[]>(() => {
    const saved = localStorage.getItem('motostream_stock');
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('motostream_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('motostream_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [containers, setContainers] = useState<Container[]>(() => {
    const saved = localStorage.getItem('motostream_containers');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('motostream_stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('motostream_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('motostream_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('motostream_containers', JSON.stringify(containers));
  }, [containers]);

  // Handlers
  const addBike = (bike: Omit<Bike, 'id' | 'status'>) => {
    const newBike: Bike = { ...bike, id: crypto.randomUUID(), status: 'available' };
    setStock(prev => [...prev, newBike]);
  };

  const addBulkStock = (bikes: Omit<Bike, 'id' | 'status'>[]) => {
    const newBikes: Bike[] = bikes.map(b => ({ ...b, id: crypto.randomUUID(), status: 'available' }));
    setStock(prev => [...prev, ...newBikes]);
  };

  const removeBike = (id: string) => {
    setStock(prev => prev.filter(b => b.id !== id));
  };

  const addContainer = (container: Container) => {
    setContainers(prev => [...prev, container]);
  };

  const addBikesToContainer = (containerId: string, bikes: Omit<Bike, 'id' | 'status'>[]) => {
    const newBikes: Bike[] = bikes.map(b => ({ 
      ...b, 
      id: crypto.randomUUID(), 
      status: 'available',
      containerId 
    }));
    
    // Add to stock
    setStock(prev => [...prev, ...newBikes]);
    
    // Update container with new bike IDs
    setContainers(prev => prev.map(c => 
      c.id === containerId 
        ? { ...c, bikeIds: [...c.bikeIds, ...newBikes.map(b => b.id)] } 
        : c
    ));
  };

  const updateBikeReg = (bikeId: string, regNumber: string) => {
    setStock(prev => prev.map(b => b.id === bikeId ? { ...b, registrationNumber: regNumber } : b));
  };

  const updateCustomerNotes = (customerId: string, notes: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, notes } : c));
  };

  const processSale = (bikeId: string, customerData: Omit<Customer, 'id' | 'purchasedBikeIds'>, salePrice: number, regDuration: '2 years' | '10 years') => {
    const bike = stock.find(b => b.id === bikeId && b.status === 'available');
    if (!bike) return;

    let customer = customers.find(c => c.nid === customerData.nid || c.phone === customerData.phone);
    
    if (!customer) {
      customer = {
        ...customerData,
        id: crypto.randomUUID(),
        purchasedBikeIds: [bikeId]
      };
      setCustomers(prev => [...prev, customer!]);
    } else {
      setCustomers(prev => prev.map(c => 
        c.id === customer!.id 
          ? { ...c, purchasedBikeIds: [...c.purchasedBikeIds, bikeId] } 
          : c
      ));
    }

    setStock(prev => prev.map(b => b.id === bikeId ? { ...b, status: 'sold' } : b));

    const newSale: Sale = {
      id: crypto.randomUUID(),
      bikeId,
      customerId: customer.id,
      saleDate: new Date().toISOString(),
      salePrice,
      registrationDuration: regDuration
    };
    setSales(prev => [...prev, newSale]);
    setPreSelectedCustomer(null);
    setActiveTab('sales');
  };

  const handlePurchaseMore = (customer: Customer) => {
    setPreSelectedCustomer(customer);
    setActiveTab('sales');
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <Logo size={48} className="flex-shrink-0" />
          <span className="text-lg font-black tracking-tight leading-none text-indigo-950">RYAN<br/>ENTERPRISE</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<Box size={20} />} 
            label="Stock" 
            active={activeTab === 'stock'} 
            onClick={() => setActiveTab('stock')} 
          />
          <SidebarItem 
            icon={<Package size={20} />} 
            label="Containers" 
            active={activeTab === 'containers'} 
            onClick={() => setActiveTab('containers')} 
          />
          <SidebarItem 
            icon={<ShoppingCart size={20} />} 
            label="Sales" 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Customers" 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">A</div>
            <div>
              <p className="text-sm font-semibold">Admin Panel</p>
              <button onClick={() => setIsLoggedIn(false)} className="text-xs text-red-500 hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
          <div className="flex items-center space-x-4">
             <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center">
               <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
               Live System
             </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardTab stock={stock} sales={sales} customers={customers} onNavigate={setActiveTab} />}
          {activeTab === 'stock' && <StockTab stock={stock} containers={containers} onAddBike={addBike} onAddBulk={addBulkStock} onRemove={removeBike} />}
          {activeTab === 'containers' && <ContainersTab containers={containers} stock={stock} sales={sales} onAddContainer={addContainer} onAddBikesToContainer={addBikesToContainer} />}
          {activeTab === 'sales' && <SalesTab stock={stock} sales={sales} customers={customers} onProcessSale={processSale} preSelectedCustomer={preSelectedCustomer} />}
          {activeTab === 'customers' && <CustomersTab customers={customers} stock={stock} sales={sales} containers={containers} onPurchaseMore={handlePurchaseMore} onUpdateBikeReg={updateBikeReg} onUpdateCustomerNotes={updateCustomerNotes} />}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50">
        <MobileNavItem icon={<LayoutDashboard size={20} />} label="Dash" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<Package size={20} />} label="Import" active={activeTab === 'containers'} onClick={() => setActiveTab('containers')} />
        <MobileNavItem icon={<ShoppingCart size={20} />} label="Sales" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
        <MobileNavItem icon={<Users size={20} />} label="Clients" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
      </nav>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 ${active ? 'text-indigo-600' : 'text-gray-400'}`}
  >
    {icon}
    <span className="text-[10px] uppercase font-bold">{label}</span>
  </button>
);

export default App;
