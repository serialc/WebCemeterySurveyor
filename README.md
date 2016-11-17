# WebCemeterySurveyor

A web-based version of the Android version of [Cemetery Surveyor](https://github.com/serialc/CemeterySurveyor) created for the University of Luxembourg.

WCS was designed with providing accessibility and visibility to data. All data is contained in folders and JSON files rather than a database as was donw with CSA to keep data access for non technical users simpler.

## Configuration

- Rename containing folder/directory from WebCemeterySurvyor-master to WCS

# Using WCS

- Place any pictures you wish to associate with items in the WCS/photographs directory
- Place your [survey structure JSON file](https://github.com/serialc/CemeterySurveyor/blob/master/Documentation/documentation.pdf), if importing from the Android CSA, in WCS/data/PROJECTNAME/PROJECTNAME.json
- Place thumbnail images to be used as selectable buttons in the WCS/thumbnail directory in a folder/directory that you will specify in the survey configuration. So for example I would place a dozen different headstone pictures in WCS/thumbnails/grave\_headstones/\*.jpg
- Exporting data will be placed in the WCS/export directory using the project name and date-time stamped
