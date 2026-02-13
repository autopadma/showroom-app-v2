import React, { useState, useEffect } from 'react';
import { Bike, Container } from '../types';
import { Plus, Upload, Trash2, Search, FileDown, X, Box } from 'lucide-react';
import { db } from '../services/database';

interface Props {
  containers: Container[];
  onAddBike: (bike: Omit<Bike, 'id' | 'status'>) => void;
  onAddBulk: (bikes: Omit<Bike, 'id' | 'status'>[]) => void;
  onRemove: (id: string) => void;
}

const StockTab: React.FC<Props> = ({ containers, onAddBike, onAddBulk, onRemove }) => {
  const [stock, setStock] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single Bike Form State
  const [formData, setFormData] = useState({ 
    model: '', 
    chassis: '', 
    engine: '', 
    color: '',
    exporterName: '',
    containerId: ''
  });
  
  // Bulk Data State
  const [bulkInput, setBulkInput] = useState('');

  // Load motorcycles from database
  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await db.getMotorcycles();
      setStock(data);
    } catch (error) {
      console.error('Error loading motorcycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stock.filter(b => 
    b.status === 'available' && (
      b.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.chassis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.engine.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.addMotorcycle({
        model: formData.model,
        chassis: formData.chassis,
        engine: formData.engine,
        color: formData.color,
        exporterName: formData.exporterName || undefined,
        containerId: formData.containerId || undefined
      });
      
      // Refresh the list
      await loadMotorcycles();
      
      // Reset form
      setFormData({ model: '', chassis: '', engine: '', color: '', exporterName: '', containerId: '' });
      setShowModal(false);
      
      // Call the original prop for compatibility
      onAddBike(formData as any);
    } catch (error) {
      console.error('Error adding motorcycle:', error);
      alert('Failed to add motorcycle. Check console for details.');
    }
  };

  const handleBulkSubmit = async () => {
    try {
      // Process CSV/Tab format: model,chassis,engine,color
      const rows = bulkInput.trim().split('\n');
      const bikes = rows.map(row => {
        const [model, chassis, engine, color] = row.split(/[,\t]/).map(s => s.trim());
        return { model, chassis, engine, color };
      }).filter(b => b.model && b.chassis);
      
      await db.addBulkMotorcycles(bikes);
      
      // Refresh the list
      await loadMotorcycles();
      
      setBulkInput('');
      setBulkMode(false);
      setShowModal(false);
      
      // Call the original prop
      onAddBulk(bikes);
    } catch (error) {
      console.error('Error bulk adding motorcycles:', error);
      alert('Failed to add motorcycles. Check console for details.');
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this bike?')) {
      try {
        await db.deleteMotorcycle(id);
        await loadMotorcycles();
        onRemove(id);
      } catch (error) {
        console.error('Error removing motorcycle:', error);
        alert('Failed to remove motorcycle.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by model, chassis, or engine..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { setShowModal(true); setBulkMode(true); }}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={18} />
            <span>Bulk Import</span>
          </button>
          <button 
            onClick={() => { setShowModal(true); setBulkMode(false); }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            <Plus size={18} />
            <span>Add Single Bike</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Model Name</th>
                <th className="px-6 py-4">Chassis Number</th>
                <th className="px-6 py-4">Engine Number</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4">Exporter</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStock.map(bike => {
                const container = containers.find(c => c.id === bike.containerId);
                const displayExporter = bike.exporterName || container?.exporterName || '-';
                
                return (
                  <tr key={bike.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{bike.model}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{bike.chassis}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{bike.engine}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">{bike.color}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {displayExporter}
                        {container && <span className="text-xs text-gray-400 block">{container.name}</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleRemove(bike.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Box className="w-12 h-12 mb-2 opacity-20" />
                      <p>No available bikes found in stock.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Bulk Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">{bulkMode ? 'Bulk Stock Input' : 'Add New Bike'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {bulkMode ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg mb-4">
                    <strong>Format:</strong> Model, Chassis, Engine, Color (one per line)
                  </div>
                  <textarea 
                    rows={8}
                    placeholder="Example: Honda CBR, CHAS123, ENG456, Red"
                    className="w-full p-4 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                  />
                  <div className="flex space-x-3 mt-6">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                    <button onClick={handleBulkSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Import All</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Name</label>
                      <input 
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chassis Number</label>
                      <input 
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={formData.chassis}
                        onChange={(e) => setFormData({...formData, chassis: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Engine Number</label>
                      <input 
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={formData.engine}
                        onChange={(e) => setFormData({...formData, engine: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                      <input 
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-100">
                      <p className="text-sm font-bold text-gray-800 mb-2">Import Details (Optional)</p>
                      <div className="space-y-3">
                         <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link to Container</label>
                          <select
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
                            value={formData.containerId}
                            onChange={(e) => setFormData({...formData, containerId: e.target.value})}
                          >
                            <option value="">-- No Container Link --</option>
                            {containers.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.exporterName})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exporter Name</label>
                          <input 
                            placeholder={formData.containerId ? "Used from selected container" : "Enter manual exporter name"}
                            disabled={!!formData.containerId}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                            value={formData.containerId 
                                   ? containers.find(c => c.id === formData.containerId)?.exporterName || '' 
                                   : formData.exporterName}
                            onChange={(e) => setFormData({...formData, exporterName: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save Bike</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTab;