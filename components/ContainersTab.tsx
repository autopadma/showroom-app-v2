import React, { useState, useEffect } from 'react';
import { Container, Bike, Sale } from '../types';
import { Package, Plus, Upload, FileDown, Search, ArrowLeft, TrendingUp, DollarSign } from 'lucide-react';
import { db } from '../services/database';

interface Props {
  containers: Container[];
  stock: Bike[];
  sales: Sale[];
  onAddContainer: (container: Container) => void;
  onAddBikesToContainer: (containerId: string, bikes: Omit<Bike, 'id' | 'status'>[]) => void;
}

const ContainersTab: React.FC<Props> = ({ 
  containers: propContainers, 
  stock, 
  sales, 
  onAddContainer, 
  onAddBikesToContainer 
}) => {
  const [containers, setContainers] = useState<Container[]>(propContainers);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  
  // New Container Form
  const [newContainerName, setNewContainerName] = useState('');
  const [newExporterName, setNewExporterName] = useState('');
  
  // Bulk Import State
  const [bulkInput, setBulkInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // Load containers from database on mount
  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setLoading(true);
    try {
      const data = await db.getContainers();
      setContainers(data);
    } catch (error) {
      console.error('Error loading containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newContainer = await db.addContainer({
        name: newContainerName,
        exporterName: newExporterName,
        importDate: new Date().toISOString(),
        bikeIds: []
      });
      const handleBulkSubmit = async () => {
    if (!selectedContainer) {
      alert('No container selected');
      return;
    }
    
    setImporting(true);
    console.log('=== BULK IMPORT DEBUG ===');
    console.log('Selected container:', selectedContainer);
    console.log('Bulk input:', bulkInput);
    
    try {
      const rows = bulkInput.trim().split('\n');
      const bikes = [];
      
      for (const row of rows) {
        if (!row.trim()) continue;
        
        const [model, chassis, engine, color, buyingPrice] = row.split(/[,\t]/).map(s => s.trim());
        
        if (!model || !chassis || !engine || !color) {
          console.log('Skipping invalid row:', row);
          continue;
        }
        
        bikes.push({
          model,
          chassis,
          engine,
          color,
          buyingPrice: buyingPrice ? Number(buyingPrice) : 0,
          exporterName: selectedContainer.exporterName,
          containerId: selectedContainer.id
        });
      }
      
      console.log('Bikes to import:', bikes);
      
      if (bikes.length === 0) {
        alert('No valid bikes found in input');
        setImporting(false);
        return;
      }
      
      await db.addBulkMotorcycles(bikes);
      
      // Update local state
      setContainers(prev => [...prev, newContainer]);
      
      // Call original prop
      onAddContainer(newContainer);
      
      // Reset form
      setNewContainerName('');
      setNewExporterName('');
      
    } catch (error) {
      console.error('Error creating container:', error);
      alert('Failed to create container');
    }
  };

  const handleBulkSubmit = async () => {
  if (!selectedContainer) {
    alert('No container selected');
    return;
  }
  
  setImporting(true);
  
  try {
    const rows = bulkInput.trim().split('\n');
    const bikes = [];
    
    for (const row of rows) {
      if (!row.trim()) continue;
      
      // Split by comma or tab
      const [model, chassis, engine, color, buyingPrice] = row.split(/[,\t]/).map(s => s.trim());
      
      if (!model || !chassis || !engine || !color) {
        console.log('Skipping invalid row:', row);
        continue;
      }
      
      // IMPORTANT: Make sure containerId is set!
      bikes.push({
        model,
        chassis,
        engine,
        color,
        buyingPrice: buyingPrice ? Number(buyingPrice) : 0,
        exporterName: selectedContainer.exporterName,
        containerId: selectedContainer.id  // ✅ This must be set
      });
    }
    
    console.log('Bikes to import with containerId:', bikes);
    
    if (bikes.length === 0) {
      alert('No valid bikes found in input');
      setImporting(false);
      return;
    }
    
    // Add bikes to database
    await db.addBulkMotorcycles(bikes);
    
    // Refresh the container list and the current container view
    await loadContainers();
    
    // Also refresh the selected container's bikes by updating the stock
    // You might need to reload the stock data here
    
    setBulkInput('');
    setShowImportModal(false);
    
    alert(`✅ Successfully imported ${bikes.length} motorcycles to ${selectedContainer.name}!`);
    
  } catch (error) {
    console.error('Error importing bikes:', error);
    alert('Failed to import bikes. Check console for details.');
  } finally {
    setImporting(false);
  }
};

      
      // Call original prop
      onAddBikesToContainer(selectedContainer.id, bikes);
      
      // Reset
      setBulkInput('');
      setShowImportModal(false);
      
    } catch (error) {
      console.error('Error importing bikes:', error);
      alert('Failed to import bikes');
    } finally {
      setImporting(false);
    }
  };

  const exportToExcel = (container: Container) => {
    const containerBikes = stock.filter(b => b.containerId === container.id);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Model,Chassis,Engine,Color,Status,Buying Price,Selling Price,Profit\n";

    containerBikes.forEach(bike => {
      const sale = sales.find(s => s.bikeId === bike.id);
      const sellPrice = sale ? sale.salePrice : 0;
      const buyPrice = bike.buyingPrice || 0;
      const profit = sellPrice > 0 ? sellPrice - buyPrice : 0;

      csvContent += `"${bike.model}","${bike.chassis}","${bike.engine}","${bike.color}","${bike.status}",${buyPrice},${sellPrice},${profit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${container.name}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading containers...</p>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedContainer) {
    const containerBikes = stock.filter(b => b.containerId === selectedContainer.id);
    const totalBuyingPrice = containerBikes.reduce((sum, b) => sum + (b.buyingPrice || 0), 0);
    const soldBikes = containerBikes.filter(b => b.status === 'sold');
    
    let totalSales = 0;
    soldBikes.forEach(b => {
      const sale = sales.find(s => s.bikeId === b.id);
      if (sale) totalSales += sale.salePrice;
    });

    const realizedProfit = totalSales - soldBikes.reduce((sum, b) => sum + (b.buyingPrice || 0), 0);

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setView('list')} className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="mr-2" size={20} /> Back to Containers
          </button>
          <div className="flex gap-2">
             <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} /> Add Stock
            </button>
            <button 
              onClick={() => exportToExcel(selectedContainer)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileDown size={18} /> Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedContainer.name}</h2>
          <p className="text-gray-500 mb-6">Exporter: <span className="font-semibold text-gray-700">{selectedContainer.exporterName}</span></p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 font-bold uppercase">Total Investment</p>
              <p className="text-2xl font-black text-blue-900">৳{totalBuyingPrice.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 font-bold uppercase">Realized Profit</p>
              <p className="text-2xl font-black text-green-900">৳{realizedProfit.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-1">{soldBikes.length} of {containerBikes.length} sold</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-600 font-bold uppercase">Units</p>
              <p className="text-2xl font-black text-purple-900">{containerBikes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Chassis</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Buying Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {containerBikes.map(bike => {
                const sale = sales.find(s => s.bikeId === bike.id);
                const sellPrice = sale ? sale.salePrice : 0;
                const profit = sellPrice > 0 ? sellPrice - (bike.buyingPrice || 0) : 0;
                
                return (
                  <tr key={bike.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800">{bike.model}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{bike.chassis}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${bike.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {bike.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">৳{(bike.buyingPrice || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{sellPrice > 0 ? `৳${sellPrice.toLocaleString()}` : '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{profit > 0 ? `৳${profit.toLocaleString()}` : '-'}</td>
                  </tr>
                );
              })}
              {containerBikes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No bikes added to this container yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold mb-4">Import Stock to Container</h3>
              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mb-4">
                <strong>Format:</strong> Model, Chassis, Engine, Color, Buying Price (one per line)
              </div>
              <textarea 
                rows={8}
                placeholder="Yamaha R15M, CHAS001, ENG001, Silver, 450000"
                className="w-full p-4 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none mb-4"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                disabled={importing}
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowImportModal(false)} 
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkSubmit} 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                  disabled={importing || !bulkInput.trim()}
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Container Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <Package className="mr-2 text-indigo-500" /> New Container
          </h3>
          <form onSubmit={handleCreateContainer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Container Name / ID</label>
              <input 
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. March 2024 Shipment"
                value={newContainerName}
                onChange={(e) => setNewContainerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Exporter Name</label>
              <input 
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. Tokyo Exports Ltd."
                value={newExporterName}
                onChange={(e) => setNewExporterName(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all">
              Create Container Profile
            </button>
          </form>
        </div>

        {/* List of Containers */}
        <div className="md:col-span-2 grid grid-cols-1 gap-4">
          {containers.map(container => {
             const itemCount = stock.filter(b => b.containerId === container.id).length;
             return (
              <div key={container.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{container.name}</h4>
                  <p className="text-sm text-gray-500">{container.exporterName} • {new Date(container.importDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold">Total Units</p>
                    <p className="font-black text-xl">{itemCount}</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedContainer(container); setView('detail'); }}
                    className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <ArrowLeft className="rotate-180" size={20} />
                  </button>
                </div>
              </div>
             );
          })}
          {containers.length === 0 && (
             <div className="text-center py-12 text-gray-400">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p>No containers added yet.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainersTab;
