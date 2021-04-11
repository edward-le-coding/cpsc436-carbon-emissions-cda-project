# CPSC 436V Project

*Reference and source any external material here*

Boilerplate HTML and main.js taken from P2

Landing Page:
- Inserting Background Pictures: https://www.w3schools.com/cssref/css3_pr_background-size.asp
- Building a landing page/inserting a background picture: https://www.youtube.com/watch?v=hVdTQWASliE
- Landing Page Picture: https://pixabay.com/photos/edmonton-canada-city-cities-77798/

Choropleth:
- D3 choropleth example for guidance on structuring code and syntax, source of topojson: https://codesandbox.io/s/little-fire-lf2zt
General File Structure:
  - Previous assignments
Data manipulation/pre-processing
- https://stackoverflow.com/questions/17071871/how-to-select-rows-from-a-dataframe-based-on-column-values
- https://stackoverflow.com/questions/16729574/how-to-get-a-value-from-a-cell-of-a-dataframe
- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.rename.html
- https://stackoverflow.com/questions/11285613/selecting-multiple-columns-in-a-pandas-dataframe
- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.merge.html
- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.to_csv.html



Flo's useful links: 
- https://observablehq.com/@d3/stacked-bar-chart
- scrollytelling: https://bl.ocks.org/baronwatts/2a50ae537d7c46670aa5eb30254ef751
- srollytelling: https://towardsdatascience.com/how-i-created-an-interactive-scrolling-visualisation-with-d3-js-and-how-you-can-too-e116372e2c73

Flo's sources: 
- for finding max in 2D matrix: https://stackoverflow.com/questions/31249419/how-to-find-max-value-from-a-2d-matrix-using-d3-js
- for rotating and placing y-axis label: https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
- for color schemes: https://observablehq.com/@d3/color-schemes
- for selecting classes when using numbers: https://stackoverflow.com/questions/17435838/how-to-use-d3-selectall-with-multiple-class-names/17436116
- for basic outline of renderVis(): https://github.com/UBC-InfoVis/2021-436V-examples/tree/master/d3-stacked-bar-chart
 

Flo's TODOs:
- use better colors for stacked bar chart
- rollup the data where there is literally 0
- remove last tick (maybe remove axis line altogether)
- need to deal with cases where d[1] is null
- ask Francis why I have to use .axis-label instead of attr('class', 'axis)
- why do I need d and i for legend even though I don't use d?
- why is xValue d.data.year instead of just d.year? where does d.data.year come from?
Heatmap:
- https://github.com/UBC-InfoVis/2021-436V-case-studies/tree/master/case-study_measles-and-vaccines
- https://www.d3-graph-gallery.com/graph/heatmap_style.html

Policy:
- linking to another page https://www.homeandlearn.co.uk/WD/wds5pA.html
Policy Dataset:
1. needed to edit the start years of some to be just one year.
2. needed to just have one word in 'status of implementation' column.
below are links i used to find the start years
- Ontario Emissions Reduction fund date 2021 https://www.nrcan.gc.ca/science-and-data/funding-partnerships/funding-opportunities/current-funding-opportunities/emissions-reduction-fund/22781
- 'Alberta Coal-Fired Electricity Generation phaseout*' https://globalnews.ca/news/7502144/alberta-coal-power-ahead-of-schedule/
- 'New Brunswick Output Based Pricing (OBPS) for Industry and Electricity* ' https://www2.gnb.ca/content/dam/gnb/Departments/env/pdf/Climate-Climatiques/MadeInNBRegulatoryApproachForLargeIndustrialEmitters.pdf
- 'British Columbia Promoting Use of Low Carbon and Renewable Materials in Infrastructure' https://www2.gov.bc.ca/assets/gov/environment/climate-change/cng/resources/lcm-public-sector-guide.pdf
- 'Ontario Greenhouse Gas Emissions Performance Standards Regulation' https://www.ontario.ca/page/emissions-performance-standards-program#:~:text=Related-,Overview,and%20circumstances%20of%20our%20province.
- 'Prince Edward Island Alternative Land Use Services Program' https://www.princeedwardisland.ca/en/service/alternative-land-use-services-alus-program 

Policy dataset stretch goal: in 'estimate of mitigation 2020/2030' columns, add legend from page 125 of the policy pdf to match up NE vs NA and the subletters a,b,c,etc.
- remove * and ** from first column: DONE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll

Policy implementation timeline
- P2 melissa's bar chart
- http://bl.ocks.org/mstanaland/6100713
- https://observablehq.com/@d3/stacked-bar-chart

removing an element from an array
// source: https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array

For the policy stacked bar chart, I (Melissa) had to add custom attributes y0 and y1 to allow the data to be stacked.
I tried using the d3 stack generator but it did not work because the d3.stack.keys were not keys in the data object.
My keys were values of the 'Sector_Affected' attribute.
I also took some inspiration from a tip in the 'Data Sketch|es: A Visualization A Month - Shirley Wu and Nadieh Bremer' video from Week 13: https://www.youtube.com/watch?v=4EOG7KwFspk&feature=youtu.be In it, they recommend doing some data preprocessing on datasets to help with styling. 
I thought that creating y0 and y1 key-value pairs could be useful.
To style the height and y value in the d3 'rect' data join, I followed the class example 'stackedBarChart' here https://github.com/UBC-InfoVis/2021-436V-examples/tree/master/d3-stacked-bar-chart.

Formatting tooltip on policy timeline/stacked bar chart
formatting the thousand place comma
https://stackoverflow.com/questions/15211488/formatting-numbers-with-commas-in-d3 user 'ericsoco'

Adding in the historical dataset
- used promise.all in main, like in the historical main
- had to change the domains of the axis
- had to move the xaxis from the top to yscale(0), following this source http://bl.ocks.org/maaquib/6e989956b99b819d69e9

Conditional rendering for historical data in policy timeline
- https://stackoverflow.com/questions/10784018/how-can-i-remove-or-replace-svg-content