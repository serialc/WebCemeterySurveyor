# WebCemeterySurveyor

A web-based version of the [Android version](https://play.google.com/store/apps/details?id=net.frakturmedia.cemeterysurvey) of [Cemetery Surveyor](https://github.com/serialc/CemeterySurveyor) created for the University of Luxembourg.

WCS was designed with providing accessibility and visibility to data. All data is contained in folders and JSON files rather than a database as was done with CSA to keep data access for non technical users simpler.

## Installation

### Requirements
- A server,  with:
  * PHP [with zip support](https://www.php.net/manual/en/zip.installation.php)
  * using the Rewrite mod Rewrite mod. Installation:
```bash
    sudo a2enmod rewrite
    sudo systemctl restart apache2
```

### Configuration
- Download and extract the application to your webserver root folder or a sub-folder.
- Rename the containing folder/directory from ```WebCemeterySurvyor-master``` to ```WCS```
- If you desire to have WCS elsewhere than in the root path/folder, you will need to update 8 locations in index.php.
- Depending on web service permissions you may need to create the required folders manually (or 'sudo php index.php')
  * Folders generated and which the server user needs access to modify are: ```data export```

# Using WCS

- Place any pictures you wish to associate with items in the WCS/photographs directory
- Place your [survey structure JSON file](https://github.com/serialc/CemeterySurveyor/blob/master/Documentation/documentation.pdf), if importing from the Android CSA, in WCS/data/PROJECTNAME/PROJECTNAME.json
- Place thumbnail images to be used as selectable buttons in the WCS/thumbnail directory in a folder/directory that you will specify in the survey configuration. So for example I would place a dozen different headstone pictures in WCS/thumbnails/grave\_headstones/\*.jpg
- Exporting data: Clicking the export button on the project/survey page downloads the data (but not pictures). The data is also exported to the WCS/export directory using the project name and date-time stamped and the pictures are copied into a photographs subdirectory.
- Dependency questions: It is possible to hide follow up questions base on a radio question's response. The number of following groups to hide can be specified. This option will only appear when the radio question is not in the last group (and a radio question).
