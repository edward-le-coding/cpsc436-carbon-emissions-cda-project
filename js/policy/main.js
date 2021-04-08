let masterPolicyData;
let timeline;
/**
 * Load data from CSV file asynchronously and render charts
 */
Promise.all([
  d3.csv('data/policy/Biennial_Report_Raw_Data.csv'),
  d3.csv('data/historical/historical_dataset.csv')
]).then(_data => {
  masterPolicyData = _data[0]
  masterHistoricalData = _data[1]
  masterPolicyData.forEach(d => {
   d.Name_of_Mitigation_Action = d.Name_of_Mitigation_Action.replaceAll('*', ''); // STRING
   d.Sector_Affected = d.Sector_Affected == 'LULUCF'? 'Land Use, Land-Use Change, and Forestry': d.Sector_Affected; // STRING
   d.GHGs_Affected = typeof d.GHGs_Affected == 'undefined' ? console.log('GHG is undefined', d.Name_of_Mitigation_Action) :  d.GHGs_Affected.replaceAll(' ', '').split(',') // ARRAY of STRINGS
   // d.Objective_andor_Activity_Affected = d.Objective_andor_Activity_Affected // STRING
   d.Type_of_Instrument = d.Type_of_Instrument.replaceAll(' ', '').split(',') // ARRAY of STRINGS
   d.Start_year_of_Implementation = +d.Start_year_of_Implementation // NUMBER (integer)
   d.Implementation_Entity = d.Implementation_Entity.split(',' ) // ARRAY of STRINGS
  
   d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq = d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq.includes('N') ? d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq : -d.Estimate_of_Mitigation_Impact_in_2020_Kt_CO2_eq; // STRING OR NUMBER
   d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq = d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq.includes('N') ? d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq : -d.Estimate_of_Mitigation_Impact_in_2030_Kt_CO2_eq; // STRING OR NUMBER
   // d.Brief_Description = d.Brief_Description // STRING
  });
  // Sort by start year of implementation
  masterPolicyData.sort((a,b) => a.Start_year_of_Implementation - b.Start_year_of_Implementation);

  masterHistoricalData.forEach(d => {
    Object.keys(d).forEach(attr => {
      d.Year = +d.Year;
      d.CO2eq = +parseFloat(d.CO2eq).toFixed(0); // 1 megatonne = 1000 kilotonnes (the units that the policy dataset is in)
    });
  });

  let canadaHistoricalData = masterHistoricalData.filter(d=>d.Region=='Canada'&&d.Source=='Total')
  canadaHistoricalData = canadaHistoricalData.map(d=>{
    return {...d, CO2eq: d.CO2eq*1000} //multiply by 1000 because 1 Mt (unit historical data) = 1000 Kt (unit policy data)
  }) 
  canadaHistoricalData = canadaHistoricalData.sort((a,b) => a.Year - b.Year)
  console.log('CanadaHistoricalData', canadaHistoricalData)

  timeline = new Timeline({
    parentElement: '#timeline'
  }, masterPolicyData, canadaHistoricalData)

}).catch(error => console.error(error)); 

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
  