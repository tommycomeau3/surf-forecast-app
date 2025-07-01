const pool = require('../models/database');
const fs = require('fs');
const path = require('path');

async function updateSurfSpots() {
  try {
    console.log('🌊 Updating surf spots database...');
    
    // Read the init.sql file
    const initSqlPath = path.join(__dirname, '../models/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    // Extract just the INSERT statements for surf spots
    const insertMatch = initSql.match(/INSERT INTO surf_spots[\s\S]*?ON CONFLICT \(name, region\) DO NOTHING;/);
    
    if (!insertMatch) {
      throw new Error('Could not find INSERT statements in init.sql');
    }
    
    const insertStatement = insertMatch[0];
    
    // Execute the INSERT statement
    await pool.query(insertStatement);
    
    // Get count of surf spots
    const result = await pool.query('SELECT COUNT(*) FROM surf_spots');
    const count = result.rows[0].count;
    
    console.log(`✅ Database updated successfully! Total surf spots: ${count}`);
    
    // List all regions
    const regionsResult = await pool.query('SELECT DISTINCT region, COUNT(*) as count FROM surf_spots GROUP BY region ORDER BY region');
    console.log('\n📍 Surf spots by region:');
    regionsResult.rows.forEach(row => {
      console.log(`   ${row.region}: ${row.count} spots`);
    });
    
  } catch (error) {
    console.error('❌ Error updating surf spots:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateSurfSpots();
}

module.exports = updateSurfSpots;