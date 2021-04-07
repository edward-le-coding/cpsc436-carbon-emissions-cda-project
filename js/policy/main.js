let masterPolicyData;
let timeline;
/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/policy/Biennial_Report_Raw_Data.csv').then(_data => {
  masterPolicyData = _data
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

  timeline = new Timeline({
    parentElement: '#timeline'
  }, masterPolicyData)

}).catch(error => console.error(error)); 

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
  