import { neon } from '@neondatabase/serverless';

console.log('🔄 Database service loading...');
const sql = neon(import.meta.env.VITE_DATABASE_URL);
console.log('✅ SQL client created');

export const db = {
  // ============ MOTORCYCLES ============
  async getMotorcycles() {
    console.log('🔍 Fetching motorcycles...');
    try {
      const result = await sql`
        SELECT * FROM motorcycles 
        WHERE status = 'available' 
        ORDER BY created_at DESC
      `;
      console.log('✅ Found motorcycles:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  },

  async getAllMotorcycles() {
    const result = await sql`
      SELECT * FROM motorcycles 
      ORDER BY created_at DESC
    `;
    return result;
  },

  async addMotorcycle(bike: any) {
    console.log('➕ Adding motorcycle:', bike);
    try {
      const result = await sql`
        INSERT INTO motorcycles (
          model, chassis, engine, color, exporter_name, container_id, buying_price
        ) VALUES (
          ${bike.model}, 
          ${bike.chassis}, 
          ${bike.engine}, 
          ${bike.color}, 
          ${bike.exporterName || null},
          ${bike.containerId || null},
          ${bike.buyingPrice || null}
        )
        RETURNING *
      `;
      console.log('✅ Added:', result[0]);
      return result[0];
    } catch (error) {
      console.error('❌ Error adding motorcycle:', error);
      throw error;
    }
  },

  async addBulkMotorcycles(bikes: any[]) {
  console.log('📦 Bulk adding', bikes.length, 'motorcycles');
  console.log('First bike containerId:', bikes[0]?.containerId); // Debug log
  
  try {
    const results = [];
    
    for (const bike of bikes) {
      console.log('Inserting bike with containerId:', bike.containerId); // Debug log
      
      const result = await sql`
        INSERT INTO motorcycles (
          model, 
          chassis, 
          engine, 
          color, 
          exporter_name, 
          container_id,  -- This is the database column
          buying_price
        ) VALUES (
          ${bike.model}, 
          ${bike.chassis}, 
          ${bike.engine}, 
          ${bike.color}, 
          ${bike.exporterName || null},
          ${bike.containerId || null},  -- This matches the column
          ${bike.buyingPrice || null}
        )
        RETURNING *
      `;
      
      results.push(result[0]);
    }
    
    console.log('✅ Bulk add results:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Error in bulk add:', error);
    throw error;
  }
}
  async findMotorcycleByChassis(chassis: string) {
    const result = await sql`
      SELECT * FROM motorcycles 
      WHERE chassis = ${chassis} AND status = 'available'
    `;
    return result[0] || null;
  },

  async updateMotorcycleRegistration(id: string, regNumber: string) {
    await sql`
      UPDATE motorcycles 
      SET registration_number = ${regNumber} 
      WHERE id = ${id}
    `;
  },

  async deleteMotorcycle(id: string) {
    await sql`
      DELETE FROM motorcycles 
      WHERE id = ${id}
    `;
  },

  // ============ CONTAINERS ============
  async getContainers() {
    const result = await sql`
      SELECT * FROM containers 
      ORDER BY created_at DESC
    `;
    return result;
  },

  async addContainer(container: any) {
    const result = await sql`
      INSERT INTO containers (name, exporter_name, import_date)
      VALUES (${container.name}, ${container.exporterName}, ${container.importDate || new Date().toISOString()})
      RETURNING *
    `;
    return result[0];
  },

  // ============ CUSTOMERS ============
  async getCustomers() {
    const result = await sql`
      SELECT * FROM customers 
      ORDER BY created_at DESC
    `;
    return result;
  },

  async addCustomer(customer: any) {
    const result = await sql`
      INSERT INTO customers (
        name, father_name, mother_name, phone, nid, dob, address, notes
      ) VALUES (
        ${customer.name},
        ${customer.fatherName},
        ${customer.motherName},
        ${customer.phone},
        ${customer.nid},
        ${customer.dob},
        ${customer.address},
        ${customer.notes || ''}
      )
      RETURNING id
    `;
    return result[0].id;
  },

  async findCustomerByPhoneOrNid(phone: string, nid: string) {
    const result = await sql`
      SELECT * FROM customers 
      WHERE phone = ${phone} OR nid = ${nid}
    `;
    return result[0] || null;
  },

  async updateCustomerNotes(id: string, notes: string) {
    await sql`
      UPDATE customers 
      SET notes = ${notes} 
      WHERE id = ${id}
    `;
  },

  // ============ SALES ============
  async getSales() {
    const result = await sql`
      SELECT s.*, 
             m.model, m.chassis, m.engine, m.color,
             c.name as customer_name, c.phone
      FROM sales s
      JOIN motorcycles m ON s.motorcycle_id = m.id
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.sale_date DESC
    `;
    return result;
  },

  async createSale(sale: any) {
    // Start a transaction
    await sql`BEGIN`;
    
    try {
      // Update motorcycle status
      await sql`
        UPDATE motorcycles 
        SET status = 'sold' 
        WHERE id = ${sale.motorcycleId}
      `;
      
      // Create sale record
      const result = await sql`
        INSERT INTO sales (
          motorcycle_id, customer_id, sale_price, registration_duration
        ) VALUES (
          ${sale.motorcycleId},
          ${sale.customerId},
          ${sale.salePrice},
          ${sale.registrationDuration}
        )
        RETURNING *
      `;
      
      await sql`COMMIT`;
      return result[0];
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  },

  // ============ DASHBOARD STATS ============
  async getDashboardStats() {
    const [stock] = await sql`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as in_stock,
             SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold
      FROM motorcycles
    `;
    
    const [sales] = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(sale_price), 0) as revenue
      FROM sales
    `;
    
    const [customers] = await sql`
      SELECT COUNT(*) as count FROM customers
    `;
    
    return {
      inStock: Number(stock.in_stock) || 0,
      outOfStock: Number(stock.sold) || 0,
      totalSales: Number(sales.count) || 0,
      totalRevenue: Number(sales.revenue) || 0,
      totalCustomers: Number(customers.count) || 0
    };
  },

  async getRecentSales(limit: number = 5) {
    const result = await sql`
      SELECT 
        s.sale_date as date,
        c.name as customer,
        m.model,
        s.sale_price as price
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN motorcycles m ON s.motorcycle_id = m.id
      ORDER BY s.sale_date DESC
      LIMIT ${limit}
    `;
    return result;
  }
};
