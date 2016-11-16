<?php
date_default_timezone_set("UTC");

PHP_OS == "Windows" || PHP_OS == "WINNT" ? define("SEPARATOR", "\\") : define("SEPARATOR", "/");

class wcsalib {

    # define private variables here
    private $data;
    public $basepath;
    public $project;
    private $jdata = false;
    private $photo_dir;

    # constructor
    public function __construct() {
        # set working dir to the that where index.php is
        # This is important as ajax calls are originally using inc/ as working dir.
        $cwd = explode(SEPARATOR, getcwd());
        if( array_pop($cwd) === 'inc' ) {
            // go to parent
            chdir('..');
        }

        # Check data dir exists and create it if not
        $this->data = 'data/';
        if (!file_exists($this->data)) {
            mkdir($this->data);
        } 

        # Check that general photo dir exists and create it if not
        $this->photo_dir = 'photographs/';
        if (!file_exists($this->photo_dir)) {
            mkdir($this->photo_dir);
        } 

        # Get URL base path
        $url = 'http://' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'];
        $this->basepath = explode('WCS', $url)[0] . 'WCS/';

        # Extract the project name from the url (If there is one!)
        $project_search = explode('WCS', trim($url, '/'));
        if( count($project_search) < 2 ) {
            $this->project = '';
        } else {
            $project_search = explode('/', trim($project_search[1], '/'));
            if( count($project_search) === 2 && $project_search[0] === 'surveys' ) {
                $this->project = $project_search[1];
            }
        }
    }

    function __destruct() {
        # empty
    }

    public function page_request($req_list) {
        #print_r($req_list);

        # Remove any empty values 
        if ( $req_list[0] === '') {
            array_shift($req_list);
        }

        # depending on length do different things
        switch(count($req_list)) {
        case 0:
            # Display main projects page
            $this->_list_surveys();
            break;
        case 1:
            break;
        case 2:
            $activity = array_shift($req_list);
            $project = array_shift($req_list);

            switch($activity) {
            case "editsurvey":
                # Load survey in JS
                print '<script type="text/javascript"> WCSA = {"survey": ' . $this->_load_json_survey($project, 'json') . '}; </script>'; 
                $this->_display_survey_editor($project);
                break;

            case "surveys":
                # Load survey in JS
                print '<script type="text/javascript"> WCSA = {"survey": ' . $this->_load_json_survey($project, 'json') . ',' .
                    '"id": {"scope": "section", "project": "' . $project . '"}' .
                    '}; </script>'; 
                $this->_show_cemeteries($project);
                $this->_show_bookmarks($project);
                break;

            default:
                print "Unhandled outcome in page_request() where there are two variables.";
            }

            break;

        case 4:
            $activity = array_shift($req_list);
            $project = array_shift($req_list);
            $activity_sub1 = array_shift($req_list);
            $cemetery = array_shift($req_list);

            switch($activity_sub1) {
            case 'cemeteries':
                print '<script type="text/javascript"> WCSA = {"survey": ' . $this->_load_json_survey($project, 'json') . ',' .
                    '"id": {"scope": "cemetery", "project": "' . $project . '", "cemetery": "' . $cemetery . '"}' .
                    '}; </script>'; 
                $this->_show_cemetery_contents($project, $cemetery);
                break;

            default:
                print 'Unknown request structure in page_request() with four variables.';
            }
            break;

        case 6:
            $activity = array_shift($req_list);
            $project = array_shift($req_list);
            $activity_sub1 = array_shift($req_list);
            $cemetery = array_shift($req_list);
            $activity_sub2 = array_shift($req_list);
            $section = array_shift($req_list);

            switch($activity_sub2) {
            case 'sections':
                print '<script type="text/javascript"> WCSA = {"survey": ' . $this->_load_json_survey($project, 'json') . ',' .
                    '"id": {"scope": "section", "project": "' . $project . '", "cemetery": "' . $cemetery . '", "section": "' . $section . '"}' .
                    '}; </script>'; 
                $this->_show_section_contents($project, $cemetery, $section);
                break;

            default:
                print 'Unknown request structure in page_request() with four variables.';
            }
            break;

        case 8:
            $activity = array_shift($req_list);
            $project = array_shift($req_list);
            $activity_sub1 = array_shift($req_list);
            $cemetery = array_shift($req_list);
            $activity_sub2 = array_shift($req_list);
            $section = array_shift($req_list);
            $activity_sub3 = array_shift($req_list);
            $grave = array_shift($req_list);

            switch($activity_sub3) {
            case 'graves':
                print '<script type="text/javascript"> WCSA = {"survey": ' . $this->_load_json_survey($project, 'json') . ',' .
                    '"id": {"scope": "grave", "project": "' . $project . '", "cemetery": "' . $cemetery . '", "section": "' . $section . '", "grave": "' . $grave . '"}' .
                    '}; </script>'; 
                $this->_show_grave_contents($project, $cemetery, $section, $grave);
                break;
            default:
                print 'Unknown request structure in page_request() with eight variables.';
            }
            break;

        default:
            # All other
            print 'Unknown request structure in page_request() with ' . count($req_list) . ' variables.';
        }
    }

    public function create_new_survey($name) {
        # create dir if it does not exist
        $fp = $this->data . $name;

        if( is_writable($this->data) ) {
            if( mkdir($fp) ) {
                # create basic json file and save it in new dir
                $this->_save_json_survey( $name, array('_type' => 'root', 'cemetery' => array(), 'section' => array(), 'grave' => array()) );
            } else {
                $this->send_error("DUPLICATE ERROR: Survey name already exists.");
            }
        } else {
            $this->send_error("NO WRITING PERMISSION: Cannot create folders/files.");
        }
    }

    # Create the dir (and other stuff) for a new cem, section or grave
    public function create_new_scope_item($data) {

        #print_r($data);
        switch($data['scope']) {
        case 'cemetery':
            # create dir if it does not exist
            mkdir($this->data . $data['project'] . '/' . $data['cemetery']);
            file_put_contents($this->data . $data['project'] . '/' . $data['cemetery'] . '/' . $data['cemetery'] . '.json', json_encode(array(), JSON_PRETTY_PRINT) );
            break;

        case 'section':
            # create dir if it does not exist
            mkdir($this->data . $data['project'] . '/' . $data['cemetery'] . '/' . $data['section']);
            file_put_contents($this->data . $data['project'] . '/' . $data['cemetery'] . '/' . $data['section'] . '/' . $data['section'] . '.json', json_encode(array(), JSON_PRETTY_PRINT) );
            break;

        case 'grave':
            // create a file name.json in a dir of the same name
            mkdir($this->data . $data['project'] . '/' . $data['cemetery'] . '/' . $data['section'] . '/' . $data['grave']);
            file_put_contents($this->data . $data['project'] . '/' . $data['cemetery'] . '/' . $data['section'] . '/' . $data['grave'] . '/' . $data['grave'] . '.json', json_encode(array(), JSON_PRETTY_PRINT) );
            break;

        default:
            $this->send_error("Unknown scope type in create_new_scope_item().");
        }
    }

    private function _load_json_survey($name, $get_format='php') {
        if($this->jdata === false) {
            $filepath = $this->data . $name;
            if (file_exists($filepath)) {
                # get raw file
                $this->raw = file_get_contents($filepath . '/' . $name . '.json');
                # convert JSON to PHP assoc. array
                $this->jdata = json_decode($this->raw, true);
                # Check if it is not valid
                if(!$this->jdata) {
                    print("ERROR - Malformed JSON file.");
                }
            } else {
                print("Project doesn't exist.");
                $this->jdata = false;
            }
        }

        switch($get_format) {
        case 'php':
            return($this->jdata);
            break;
        case 'json':
            return($this->raw);
            break;
        default:
            return(false);
        }
    }

    public function update_json($passed) {
        $project = $passed['project'];
        $survey = $passed['survey'];

        $this->_save_json_survey($project, $survey);
    }

    private function _save_json_survey($name, $data) {
        # Make it pretty with JSON_PRETTY_PRINT
        file_put_contents($this->data . $name . '/' . $name . '.json', json_encode($data, JSON_PRETTY_PRINT) );
    }

    private function _display_survey_editor($name) {

        print '<div class="row"><div class="col-xs-12 correction">';
        print '<h2>Edit \'' . $name . '\' survey questions</h2>';
        print '</div></div>';

        # List cemetery, section, grave hierarchies
        $scopes = array('cemetery', 'section', 'grave');

        foreach( $scopes as $uid) {
            print '<div class="row sscope">';

            # title
            print '<div class="col-xs-12" onclick="WCSA.survey_toggle_stgq_view(event, \'' . $uid . '\', \'sscope\')">';
            print '<div class="row">';
            print '<div class="col-xs-6 upper">' . $uid . '</div>';

            # icons
            print '<div class="col-xs-6 text-xs-right">';
            print '<i id="eye_icon_' . $uid . '" class="fa fa-eye" aria-hidden="true" title="Show/hide contents"></i> ';
            print '<i class="fa fa-spacer-m"></i> ';
            print '<i class="fa fa-spacer-m"></i> ';
            print '<i class="fa fa-spacer-ms"></i> ';
            print '<i class="fa fa-plus" onclick="WCSA.new_survey_item(event, \'' . $uid . '\')" aria-hidden="true" title="Create new tab"></i> ';
            print '<i class="fa fa-spacer-s"></i> ';
            print '</div>';

            # close row, heading col
            print '</div></div>';

            # tabs container
            print '<div id="' . $uid . '_contents" class="col-xs-12"></div>';
            # content is generated by JavaScript

            # end of sscope superitem
            print '</div>';
        }
    }

    # Called when editing the survey questions/structure
    public function update_survey_title($uf) {
        # Get json file
        $srv = $this->_load_json_survey($uf['project']);

        # Start drilling down using hierarchy specifiers, when no further accuracy is available - that is the target
        # START with most demanding (question) and work my way back up
        if( isset($uf['scope']) && isset($uf['tindex']) && isset($uf['gindex']) && isset($uf['qindex']) ) {
            print "Question update - should not be called";

        } elseif ( isset($uf['scope']) && isset($uf['tindex']) && isset($uf['gindex']) ) {
            # Can only be title or delete
            if ( isset($uf['title']) ) {
                # Rename title of group
                # Tabs have assoc. key 'contents' that contains array of groups
                $srv[$uf['scope']][$uf['tindex']]['contents'][$uf['gindex']]['title'] = $uf['title'];
            }
            if ( isset($uf['delete']) ) {
                print "Delete this tab if it is empty";
            }
        } elseif ( isset($uf['scope']) && isset($uf['tindex']) ) {
            # Can only be title or delete
            if ( isset($uf['title']) ) {
                # Rename title of tab
                $srv[$uf['scope']][$uf['tindex']]['title'] = $uf['title'];
            }
            if ( isset($uf['delete']) ) {
                print "Delete this tab if it is empty";
            }
        } else {
            $this->send_error("UNKNOWN HIERARCHY: Need to know what data target is: Tab, Group, Question.");
        }

        $this->_save_json_survey($uf['project'], $srv);
    }

    public function update_scope_name($data) {
        $scope = $data['scope'];
        $project = $data['project'];
        $cemetery = $data['cemetery'];
        $new_name = $data['scope_name'];

        # Need to rename the folder and the data file within (command sequence/order matters!)
        switch($scope) {
        case 'cemetery':
            rename($this->data . $project . '/' . $cemetery, $this->data . $project . '/' . $new_name);
            rename($this->data . $project . '/' . $new_name. '/' . $cemetery . '.json', $this->data . $project . '/' . $new_name . '/' . $new_name . '.json');
            break;

        case 'section':
            $section = $data['section'];
            rename($this->data . $project . '/' . $cemetery . '/' . $section, $this->data . $project . '/' . $cemetery . '/' . $new_name);
            rename($this->data . $project . '/' . $cemetery . '/' . $new_name . '/' . $section . '.json', $this->data . $project . '/' . $cemetery . '/' . $new_name . '/' . $new_name . '.json');
            break;

        case 'grave':
            $section = $data['section'];
            $grave = $data['grave'];
            rename($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $grave, $this->data . $project . '/' . $cemetery . '/' . $section . '/' . $new_name);
            rename($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $new_name . '/' . $grave . '.json', $this->data . $project . '/' . $cemetery . '/' . $section . '/' . $new_name . '/' . $new_name . '.json');
            break;
        }
    }
    # Save the state of a scope item
    private function _save_scope_state($scope, $identobj, $data) {
        switch($scope) {
        case 'cemetery':
            file_put_contents($this->data . $identobj['project'] . '/' . $identobj['cemetery'] . '/' . $identobj['cemetery'] . '.json', json_encode($data, JSON_PRETTY_PRINT) );
            break;

        case 'section':
            file_put_contents($this->data . $identobj['project'] . '/' . $identobj['cemetery'] . '/' . $identobj['section'] . '/' . $identobj['section'] . '.json', json_encode($data, JSON_PRETTY_PRINT) );
            break;

        case 'grave':
            file_put_contents($this->data . $identobj['project'] . '/' . $identobj['cemetery'] . '/' . $identobj['section'] . '/' . $identobj['grave'] . '/' . $identobj['grave'] . '.json', json_encode($data, JSON_PRETTY_PRINT) );
            break;

        default:
            print "Did not find requested json survey data.";
        }
    }
    # Get the data for this item (cem, section or grave)
    private function _load_scope_state($scope, $identobj) {

        # base path
        $fp = $this->data . $identobj['project'] . '/' . $identobj['cemetery'] . '/';

        # add to base path based on scope
        switch($scope) {
        case 'cemetery':
            $fp .= $identobj['cemetery'] . '.json';
            break;

        case 'section':
            $fp .= $identobj['section'] . '/' . $identobj['section'] . '.json';
            break;

        case 'grave':
            $fp .= $identobj['section'] . '/' . $identobj['grave'] . '/' . $identobj['grave'] . '.json';
            break;

        default:
            print "Did not find requested json survey data.";
        }

        # check that the file exists
        if( file_exists($fp) ) {
            return( json_decode( file_get_contents($fp), true) );
        }

        return false;
    }

    # Publish the survey form for this scope with the current state of the data
    private function _build_scope_survey($scope, $identobj) {
        # Starts content generation in a row div
        $survey = $this->_load_json_survey($this->project);
        $survey = (isset($survey[$scope]) ? $survey[$scope] : array());
        $state = $this->_load_scope_state($scope, $identobj);

        if( $state === false ) {
            # Bad URL most likely
            print("You have reached a non-existant location. Perhaps your URL is incorrect or obsolete.");
            return;
        }

        # if there are more than 1 tabs, build the tab system
        if( count($survey) > 1 ) {
            # Build tabs at top of page
            print '<div class="row scope_survey" style="' . ($scope === 'grave' ? 'display:        block':'') . '">';
            for( $tabnum = 0; $tabnum < count($survey); $tabnum += 1 ) {
                $tabcolw = round(12/count($survey));
                print '<div class="col-md-' . $tabcolw . ' col-xs-12 upper ttitle' . ($tabnum === 0 ? ' selected' : '') . '" onclick="WCSA.show_tab_section(this, \'tab_' . $tabnum . '\')">';
                print $survey[$tabnum]['title'];
                print '</div>';
            }
            print '</div>';

        } else {
            # show heading if there is only one tab
            print '<div class="row scope_survey"><div class="col-xs-12 correction"><h2><span class="caps">' . $scope . '</span> survey questions</h2></div></div>';
        }

        # General container for tab - but hidden
        print '<div class="row scope_survey" style="' . ($scope === 'grave' ? 'display: block':'') . '">';

        for( $tabnum = 0; $tabnum < count($survey); $tabnum += 1 ) {
            # generate survey for each tab
            $tab = $survey[$tabnum];

            print '<div id="tab_' . $tabnum . '" class="col-xs-12 tabsection' . ($tabnum !== 0 ? ' hide':'') . '">';

            # Used to set dependency visibility state
            $dependency_groups_to_hide = array();

            # go through the groups in this tab
            for( $grpnum = 0; $grpnum < count($tab['contents']); $grpnum += 1 ) {
                $group = $tab['contents'][$grpnum];

                if( in_array( $grpnum, $dependency_groups_to_hide ) ) {
                    print '<div id="group_' . $grpnum . '" style="display:none">';
                } else {
                    print '<div id="group_' . $grpnum . '">';
                }

                # Create group heading
                if( $group['title'] !== '' ) {
                    print '<div class="col-xs-12 gtitle"><h2>' . $group['title'] . '</h2></div>';
                }


                for( $catnum = 0; $catnum < count($group['contents']); $catnum += 1 ) {
                    $cat = $group['contents'][$catnum];
                    
                    # required question?
                    $required = '';
                    if( $cat['required'] === 'true' ) {
                        $required = 'red-star';
                    }

                    print '<div id="cat_' . $cat['name'] . '">';
                    if( !in_array($cat['data_type'], array('text','measurement')) ) {
                        # Give titles dropzone ability if indicated
                        print '<div class="col-xs-12 ctitle' . ($cat['camera'] === 'true' ? ' dropzone' :  '') . '" id="' . $cat['name'] . '"><h3 class="' . $required . '">' . $cat['title'] . '</h3></div>';
                    }

                    print '<div class="col-xs-12 ccontents">';

                    # Creates the 'buttons' or inputs or whateber depending on the data_type
                    switch($cat['data_type']) {

                    case 'set':
                        # Display all the set values as a series of checkboxes or buttons
                        print '<div class="row">';
                        # Go through each attribute for this questions/category
                        foreach( $cat['attributes'] as $seti ) {
                            # check if data exists for this
                            $selected = '';
                            if( isset($state[$cat['name']]) && in_array($seti, $state[$cat['name']]) ) {
                                $selected = 'selected';
                            }
                            # Add the onclick here
                            # Give attributes dropzone ability if indicated
                            print '<div class="col-xs-12 col-md-3' . ($cat['attrib_camera'] === 'true' ? ' dropzone' : '') . '" id="' . $cat['name'] . ':::' . $seti . '"><div id="' . $cat['name'] . '_' . $seti . '" class="col-xs-12 col-md-12 citem ' . $selected . '" onclick="' .
                                'WCSA.toggle_attribute(\'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'set\',\'' . 
                                                            $cat['name'] . '\',\'' . 
                                                            $seti . '\')' .
                                '">' . $seti . '</div></div>';

                        }

                        print '</div>';
                        break;

                    case 'set_thumbnail':
                        # Display all the set values as a series of checkboxes or buttons
                        print '<div class="row">';

                        # Get the list of files in the directory
                        $thumbs = $this->_list_files('thumbnails/' . $cat['attributes'] . '/');
                        foreach( $thumbs as $tn ) {
                            # check if data exists for this
                            $selected = '';
                            if( isset($state[$cat['name']]) && in_array($tn, $state[$cat['name']]) ) {
                                $selected = 'selected';
                            }
                            # Add the onclick here
                            print '<div class="col-xs-12 col-md-3' . ($cat['attrib_camera'] === 'true' ? ' dropzone' : '') . '" id="' . $cat['name'] . ':::' . $tn . '"><div id="' . $cat['name'] . '_' . $tn . '" class="col-xs-12 col-md-12 citem ' . $selected . ' set_thumbnail_' . $cat['name'] . '" onclick="' .
                                'WCSA.toggle_attribute(\'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'set_thumbnail\',\'' . 
                                                            $cat['name'] . '\',\'' . 
                                                            $tn . '\')' .
                                '"><img class="thumbnail" src="' . $this->basepath . 'thumbnails/' . $cat['attributes'] . '/' . $tn . '">' . '</div></div>';
                        }
                        #print(nl2br(print_r($cat, true)));
                        print '</div>';
                        break;

                    case 'radio':
                        # Display all the set values as a series of checkboxes or buttons
                        print '<div class="row">';

                        # Go through each attribute for this questions/category
                        foreach( $cat['attributes'] as $seti ) {
                            # check if data exists for this
                            $selected = '';
                            if( isset($state[$cat['name']]) && $state[$cat['name']] === $seti ) {
                                $selected = 'selected';
                            }
                            # Add the onclick here
                            print '<div class="col-xs-12 col-md-3' . ($cat['attrib_camera'] === 'true' ? ' dropzone' : '') . '" id="' . $cat['name'] . ':::' . $seti . '"><div id="' . $cat['name'] . '_' . $seti . '" class="col-xs-12 col-md-12 citem ' . $selected . ' radio_' . $cat['name'] . '" onclick="' .

                                'WCSA.toggle_attribute(\'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'radio\',\'' . 
                                                            $cat['name'] . '\',\'' . 
                                                            $seti . '\');' .

                                'WCSA.toggle_dependency_visibility(\'' . $cat['name'] . '_' . $cat['dependency'] . '\',' . $catnum . ',' . $cat['dependency_num'] . ')' . 

                                '">' . $seti . '</div></div>';

                            # See if any dependency hiding is enabled and store group name(s) to set their state when generating
                            if( $cat['dependency'] === $seti && $selected === 'selected' && $cat['dependency_num'] > 0 ) {
                                for( $i = $grpnum + 1; $i <= $grpnum + $cat['dependency_num']; $i += 1 ) {
                                    array_push($dependency_groups_to_hide, $i);
                                }
                            }
                        }
                        #print(nl2br(print_r($cat, true)));
                        print '</div>';
                        break;

                    case 'radio_thumbnail':
                        print '<div class="row">';

                        # Give warning if no pictures were found
                        if( !file_exists('thumbnails/' . $cat['attributes']) ) {
                            print 'Did not find any thumbnail images in the folder \'' . $cat['attributes'] . '\'.';
                        }
                        # Get the list of files in the directory
                        $thumbs = $this->_list_files('thumbnails/' . $cat['attributes']);
                        foreach( $thumbs as $tn ) {
                            # check if data exists for this
                            $selected = '';
                            if( isset($state[$cat['name']]) && $state[$cat['name']] === $tn ) {
                                $selected = 'selected';
                            }
                            # Add the onclick here
                            print '<div class="col-xs-12 col-md-3' . ($cat['attrib_camera'] === 'true' ? ' dropzone' : '') . '" id="' . $cat['name'] . ':::' . $tn . '"><div id="' . $cat['name'] . '_' . $tn . '" class="col-xs-12 col-md-12 citem ' . $selected . ' radio_thumbnail_' . $cat['name'] . '" onclick="' .
                                'WCSA.toggle_attribute(\'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'radio_thumbnail\',\'' . 
                                                            $cat['name'] . '\',\'' . 
                                                            $tn . '\')' .
                                '"><img class="thumbnail" src="' . $this->basepath . 'thumbnails/' . $cat['attributes'] . '/' . $tn . '">' . '</div></div>';
                        }
                        #print(nl2br(print_r($cat, true)));
                        print '</div>';
                        break;

                    case 'binary':
                        # Display all the set values as a series of checkboxes or buttons
                        print '<div class="row">';
                        # Binary can be true or false

                        # Go through botattribute for this questions/category
                        foreach( array('true', 'false') as $seti ) {
                            # check if data exists for this
                            $selected = '';
                            if( isset($state[$cat['name']]) && $state[$cat['name']] === ($seti === 'true') ) {
                                $selected = 'selected';
                            }
                            $binlabel = $seti === 'true' ? 'Yes' : 'No';

                            # Add the onclick here
                            print '<div class="col-xs-12 col-md-3"><div id="' . $cat['name'] . '_' . $seti . '" class="col-xs-12 col-md-12 citem ' . $selected . ' radio_' . $cat['name'] . '" onclick="' .
                                'WCSA.toggle_attribute(\'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'binary\',\'' . 
                                                            $cat['name'] . '\',\'' . 
                                                            $seti . '\')' .
                                '">' . $binlabel . '</div></div>';
                        }
                        print '</div>';
                        #print(nl2br(print_r($cat, true)));
                        break;

                    case 'measurement':
                        print '<div class="row"><div class="col-xs-12">';
                        print $this->_format_input($cat['name'],
                            $cat['title'] === '' ? $cat['name'] : $cat['title'], 
                            isset($state[$cat['name']]) ? $state[$cat['name']] : '',
                            $cat['title'] === '' ? $cat['name'] : $cat['title'], 
                            'number',
                            false,
                            'onblur="WCSA.submit_input(this, \'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'measurement\',\'' . 
                                                            $cat['name'] . '\',' . 
                                                            'this.value)" ' .
                                                            'onclick="this.focus()"',
                            $cat['required'] === 'true',
                            false,  # inline
                            $cat['camera'] === 'true' # dropzone
                        );
                        print '</div></div>';
                        break;

                    case 'text':
                        print '<div class="row"><div class="col-xs-12">';
                        print $this->_format_input($cat['name'],
                            $cat['title'] === '' ? $cat['name'] : $cat['title'], 
                            isset($state[$cat['name']]) ? $state[$cat['name']] : '',
                            $cat['title'] === '' ? $cat['name'] : $cat['title'], 
                            'text',
                            false,
                            'onblur="WCSA.submit_input(this, \'' . $scope . '\',\'' .
                                                            $identobj['project']  . '\',\'' .
                                                            $identobj['cemetery']  . '\',\'' .
                                                            (isset($identobj['section']) ? $identobj['section'] : '')  . '\',\'' .
                                                            (isset($identobj['grave']) ? $identobj['grave'] : '')  . '\',\'' .
                                                            'text\',\'' . 
                                                            $cat['name'] . '\',' . 
                                                            'this.value)" ' .
                                                            'onclick="this.focus()"',
                            $cat['required'] === 'true',
                            false, # inline
                            $cat['camera'] === 'true' #dropzone
                        );
                        print '</div></div>';
                        break;

                    default:
                        print "Unknown data_type for this survey item - JSON is misformed?";
                    }
                    print '</div></div>';
                }
                # close group
                print '</div>';
            }
            # close tabs
            print '</div>';
        }
        # close survey container class: scope_survey
        print '</div>';
    }

    # Generate the picture displays of photographs ASSOCIATED with this scope item
    private function _build_scope_pictures($scope, $project, $cemetery, $section, $grave) {
        print '<div class="row scope_pics"><div class="col-xs-12"><h2>Pictures</h2></div></div>';
        print '<div id="scope_pics_contents" class="row scope_pics">';
        # Pictures are retrieved asynchronously

        # Make sure that a photographs folder exists for this scope and create it if it doesn't yet exist
        switch( $scope ) {
        case 'cemetery':
            $pdir = $this->data . $project . '/' . $cemetery . '/photographs';
            break;

        case 'section':
            $pdir = $this->data . $project . '/' . $cemetery . '/' . $section . '/photographs';
            break;

        case 'grave':
            $pdir = $this->data . $project . '/' . $cemetery . '/' . $section . '/' . $grave . '/photographs';
            break;

        default:
            $this->send_error("Scope type not expected in build_scope_pictures().");
        }

        # Make the directory if it doesn't exist
        if( !file_exists($pdir)) {
            mkdir($pdir);
        }

        print '</div>';
    }

    public function get_scope_photographs($idobj) {

        # Load the data file for this scope item
        $data = $this->_load_scope_state($idobj['scope'], $idobj);

        if( !isset($data['photographs']) || count($data['photographs']) === 0 ) {
            return '{}';
        }

        return json_encode($data['photographs'], JSON_PRETTY_PRINT);
    }
    
    # Returns the list of photographs in the unsorted photographs folder
    public function get_unsorted_photographs() {
        return(json_encode($this->_list_files($this->photo_dir)));
    }
    public function submit_data($passed) {
        $scope = $passed['scope'];
        $project = $passed['project'];
        $cemetery = $passed['cemetery'];
        $section = $passed['section'];
        $grave = $passed['grave'];
        $data_type = $passed['data_type'];
        $name = $passed['name'];
        $value = $passed['value'];

        # Load the appropriate JSON data
        switch($scope) {
        case 'cemetery':
            $data = json_decode( file_get_contents($this->data . $project . '/' . $cemetery . '/' . $cemetery . '.json'), true );
            break;

        case 'section':
            $data = json_decode( file_get_contents($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $section . '.json'), true );
            break;

        case 'grave':
            $data = json_decode( file_get_contents($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $grave . '/' . $grave . '.json'), true );
            break;

        default:
            print "Did not find scope in submit_data().";
        }

        # Check inside the arrays for those required
        if( in_array($data_type, array('set', 'set_thumbnail')) ) {
            # Modify it accordingly
            if( isset($data[$name]) ) {
                # Is it already in the array?
                if( in_array($value, $data[$name]) ) {
                    # It is there already, so remove it
                    unset($data[$name][ array_search($value, $data[$name]) ]);
                    # To prevent associative array creation by unset-ing
                    $data[$name] = array_values($data[$name]);
                } else {
                    # Add to array
                   array_push($data[$name], $value);
                }
            } else {
                # need to create an array with the value inside
                $data[$name] = array($value);
            }
        } else {
            # radios, binary, text, measurement
            # Just set the value passed
            if( $data_type === 'binary' ) {
                # convert strings to boolean
                $data[$name] = ($value === 'true');
            } else {
                $data[$name] = $value;
            }
        }
        
        # Save modified file
        switch($scope) {
        case 'cemetery':
            $data = file_put_contents($this->data . $project . '/' . $cemetery . '/' . $cemetery . '.json', json_encode($data, JSON_PRETTY_PRINT) );
            break;

        case 'section':
            $data = file_put_contents($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $section . '.json', json_encode($data, JSON_PRETTY_PRINT) );
            break;

        case 'grave':
            $data = file_put_contents($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $grave . '/' . $grave . '.json', json_encode($data, JSON_PRETTY_PRINT) );
            break;

        default:
            print "Did not find scope in submit_data().";
        }
    }

    # Show the contents of a grave
    private function _show_grave_contents($project, $cemetery, $section, $grave) {
        if( !file_exists($this->data . $project . '/' . $cemetery . '/' . $section . '/' . $grave) ) {
            print("You have reached a non-existant location. Perhaps your URL is incorrect or obsolete.");
            return false;
        }

        # build survey
        print $this->_build_scope_survey('grave', array( "project" => $project, "cemetery" => $cemetery, "section" => $section, "grave" => $grave) );

        # build hidden pictures 
        print $this->_build_scope_pictures('grave', $project, $cemetery, $section, $grave);
    }

    # Show the contents of a section
    private function _show_section_contents($project, $cemetery, $section) {
        $glist = $this->_list_dir($this->data . $project . '/' . $cemetery . '/' . $section);
        if( $glist === false) { 
            print("You have reached a non-existant location. Perhaps your URL is incorrect or obsolete.");
            return false;
        }

        print '<div class="row scope_list"><h2 class="col-xs-12 correction">Graves for section ' . $section . '</h2></div>';

        print '<div class="row scope_list">';
        foreach($glist as $g) {
            print '<div class="col-md-3 col-xs-6">' .
                '<div class="row">' .
                '<div class="col-xs-8 item"><a class="link_item" href="' . $this->basepath . 'surveys/' . $project . '/cemeteries/' . $cemetery . '/sections/' . $section . '/graves/' . $g .'">' . $g . '</a></div>' .
                '<div class="col-xs-3 item left-div"><a class="link_item" href="#" onclick="WCSA.edit_scope_item_name(\'grave\',\'' . $project . '\',\'' . $cemetery . '\',\'' . $section . '\',\'' . $g . '\')"><i class="fa fa-pencil" aria-hidden="true"></i></a></div>' .
                '</div></div>';
        }
        # Show FAB (floating action button)
        print('<div class="fab" onclick="WCSA.new_scope_item(\'grave\',\'' . $project . '\',\'' . $cemetery . '\',\'' . $section . '\')"><i class="fa fa-plus" aria-hidden="true"></i></div>');

        # End of list view items
        print '</div>';

        # build hidden survey
        print $this->_build_scope_survey('section', array( "project" => $project, "cemetery" => $cemetery, "section" => $section) );

        # build hidden pictures 
        print $this->_build_scope_pictures('cemetery', $project, $cemetery, $section, '');
    }

    private function _show_cemetery_contents($project, $cemetery) {
        $slist = $this->_list_dir($this->data . $project . '/' . $cemetery);
        if( $slist === false) { 
            print("You have reached a non-existant location. Perhaps your URL is incorrect or obsolete.");
            return false;
        }

        print '<div class="row scope_list"><h2 class="col-xs-12 correction">Sections for cemetery ' . $cemetery . '</h2></div>';

        print '<div class="row scope_list">';
        foreach($slist as $s) {
            print '<div class="col-md-3 col-xs-6">' .
                '<div class="row">' .
                '<div class="col-xs-8 item"><a class="link_item" href="' . $this->basepath . 'surveys/' . $project . '/cemeteries/' . $cemetery . '/sections/' . $s .'">' . $s . '</a></div>' .
                '<div class="col-xs-3 item left-div"><a class="link_item" href="#" onclick="WCSA.edit_scope_item_name(\'section\',\'' . $project . '\',\'' . $cemetery . '\',\'' . $s . '\',\'\')"><i class="fa fa-pencil" aria-hidden="true"></i></a></div>' .
                '</div></div>';
        }
        # Show FAB (floating action button)
        print('<div class="fab" onclick="WCSA.new_scope_item(\'section\',\'' . $project . '\',\'' . $cemetery . '\',\'\')"><i class="fa fa-plus" aria-hidden="true"></i></div>');

        # End of list view items
        print '</div>';

        # build hidden survey
        print $this->_build_scope_survey('cemetery', array( "project" => $project, "cemetery" => $cemetery) );

        # build hidden pictures 
        print $this->_build_scope_pictures('cemetery', $project, $cemetery, '', '');
    }

    private function _show_cemeteries($project) {
        $clist = $this->_list_dir($this->data . $project);

        print '<div class="row scope_list"><h2 class="col-xs-12 correction">Cemeteries</h2></div>';

        print '<div class="row scope_list">';
        foreach($clist as $c) {
            print '<div class="col-md-3 col-xs-6">' .
                '<div class="row">' .
                '<div class="col-xs-8 item"><a class="link_item" href="' . $this->basepath . 'surveys/' . $project . '/cemeteries/' . $c .'">' . $c . '</a></div>' .
                '<div class="col-xs-3 item left-div"><a class="link_item" href="#" onclick="WCSA.edit_scope_item_name(\'cemetery\',\'' . $project . '\',\'' . $c . '\',\'\',\'\')"><i class="fa fa-pencil" aria-hidden="true"></i></a></div>' .
                '</div></div>';
        }
        print '</div>';

        # Show FAB (floating action button)
        print('<div class="fab" onclick="WCSA.new_scope_item(\'cemetery\',\'' . $project . '\',\'\',\'\')"><i class="fa fa-plus" aria-hidden="true"></i></div>');
    }

    private function _list_surveys() {
        $surveys = $this->_list_dir($this->data);

        if(count($surveys) > 0) {

            print '<div class="row">';
            foreach($surveys as $surv) {
                print '<div class="col-md-3 col-xs-6">' .
                    '<div class="row">' .
                    '<div class="col-xs-10 item"><a class="link_item" href="' . $this->basepath . 'surveys/' . $surv . '">' . $surv . '</a></div>' .
                    #'<div class="col-xs-3 item left-div"><a class="link_item" href="' . $this->basepath . 'editsurvey/' . $surv . '"><i class="fa fa-pencil" aria-hidden="true"></i></a></div>' .
                    '</div></div>';
            }
            print '</div>';

        } else {
            # No surveys yet
            print('Create a survey!');
        }

        # Show FAB (floating action button)
        print('<div class="fab" onclick="WCSA.new_survey()"><i class="fa fa-plus" aria-hidden="true"></i></div>');
    }

    # only list dirs, not files
    private function _list_dir($path) {
        $path = trim($path, '/');
        if( !file_exists($path) ) { return false; }

        $flist = scandir($path);
        $dirs = array();
        for($i = 0; $i < count($flist); $i++) {
            if(is_dir($path . '/' . $flist[$i]) && substr($flist[$i], 0, 1) !== '.' && $flist[$i] !== 'photographs') {
                array_push($dirs, $flist[$i]);
            }
        }
        return($dirs);
    }

    # only list files, not dirs
    private function _list_files($path) {
        $path = trim($path, '/');
        if( !file_exists($path) ) { return false; }

        $flist = scandir($path);
        $files = array();
        for($i = 0; $i < count($flist); $i++) {
            if(is_file($path . '/' . $flist[$i]) && substr($flist[$i], 0, 1) !== '.' ) {
                array_push($files, $flist[$i]);
            }
        }
        return($files);
    }

    public function send_error($msg) {
        print($this->_response($msg, 400));
    }

    private function _response($data, $status = 200) {
        header("HTTP/1.1 " . $status . " " . $this->_requestStatus($status));
        header('Content-Type: application/json; charset=utf-8');
        return json_encode($data);
    }
         
    private function _requestStatus($code) {
        $status = array(
            200 => 'OK',
            400 => 'Bad Request',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            500 => 'Internal Server Error',
        );
        return ($status[$code]) ? $status[$code] : $status[500];
    }

    private function _format_input($name, $title, $value, $placeholder, $type, $helptip, $input_actions, $required, $inline=false, $dropzone) {
        # Build input string
        $htmls = '';
        if( $inline === true ) {
            $htmls .= '<form class="form-inline">';
        }

        $htmls .= '<div class="form-group">' .
            '<label for="' . $name . '" class="ctitle' . ($required === true ? ' red-star' : '') . ($dropzone === true ? ' dropzone' : '') . '" id="' . $name . '">' . $title . '</label>' .
            '<input type="' . $type . '" class="form-control" id="' . $name . '_input" name="' . $name . '" value="' . $value . '" placeholder="' . $placeholder . '" ' . $input_actions . '>' .
            '<div class="form-control-feedback"></div>';
        
        # show help?
        if($helptip !== false) {
            $htmls .= '<small id="surveyhelp" class="form-text text-muted">' . $helptip . '</small>';
        }
        $htmls .= '</div>';
        if( $inline === true ) {
            $htmls .= '</form>';
        }
        return($htmls);
    }
    public function associate_photo($data) {

        # we want to update the json data for this scope item
        $state = $this->_load_scope_state($data['id']['scope'], $data['id']);
        # if the data doesn't have a photography array yet, create it
        if( !isset($state['photographs']) ) { $state['photographs'] = array(); }

        # data['id'] has scope, cemtery, section, grave identifiers as necessary
        # data['picture'] is the photgraph file naem
        # data['name'] is the category name
        # data['attribute'] is the optional/possible attribute name for this category
        
        # Update the json data
        if( isset($data['attribute']) ) {
            $state['photographs'][$data['picture']] = array("name" => $data['name'], "attribute" => $data['attribute']);
        } else {
            $state['photographs'][$data['picture']] = array("name" => $data['name']);
        }

        switch($data['id']['scope']) {
        case 'cemetery':
            # Move the photograph
            rename($this->photo_dir . $data['picture'], $this->data . $data['id']['project'] . '/' . $data['id']['cemetery'] . '/photographs/' . $data['picture']);
            break;

        case 'section':
            # Move the photograph
            rename($this->photo_dir . $data['picture'], $this->data . $data['id']['project'] . '/' . $data['id']['cemetery'] . '/' . $data['id']['section'] . '/photographs/' . $data['picture']);
            break;

        case 'grave':
            # Move the photograph
            rename($this->photo_dir . $data['picture'], $this->data . $data['id']['project'] . '/' . $data['id']['cemetery'] . '/' . $data['id']['section'] . '/' . $data['id']['grave'] . '/photographs/' . $data['picture']);
            break;

        default:
            $this->send_error("Unable to find proper scope to relocate photograph.");
        }

        # Save the update state data
        $this->_save_scope_state($data['id']['scope'], $data['id'], $state);

        return true;
    }

    private function _show_bookmarks($project) {
        # bookmark file path
        $bmfp = $this->data . $project . '/bookmarks.json';

        print '<div class="row bookmarks_list"><h2 class="col-xs-12 correction">Bookmarks</h2></div>';
        if( file_exists($bmfp) ) {
            $bookmarks = json_decode(file_get_contents( $bmfp ), true);

            print '<div class="row bookmarks_list">';
            # Iterate through bookmarks
            for($i = 0; $i < count($bookmarks); $i += 1 ) {
                $bm = $bookmarks[$i];

                print '<div class="col-lg-4 col-sm-6 col-xs-12">' . 
                    '<div class="row"><div class="col-sm-9 col-xs-8 item">' .
                    '<a class="link_item" href="' . $this->basepath . 'surveys/' . $project . 
                    '/cemeteries/' . $bm['cemetery'] . 
                    ( $bm['section'] !== '' ? '/sections/' . $bm['section'] : '' ) .
                    ( $bm['grave'] !== '' ? '/graves/' . $bm['grave'] : '' ) . '">' .
                    $bm['cemetery'] . ' ' . $bm['section'] . ' ' . $bm['grave'] .
                    '</a>' . 
                    '</div>' .
                    '<div class="col-sm-2 col-xs-3 item left-div"><a class="link_item" href="#" onclick="WCSA.delete_bookmark(' . $i . ')"><i class="fa fa-trash" aria-hidden="true"></i></a></div>' . 
                    '</div></div>';
            }
            print '</div>';
        }
    }

    public function add_bookmark($identobj) {
        $bmfp = $this->data . $identobj['project'] . '/bookmarks.json';

        # Get existing bookmarks or create new array
        if( file_exists($bmfp) ) {
            $bookmarks = json_decode(file_get_contents( $bmfp ), true);
        } else {
            $bookmarks = array();
        }

        # Add new bookmark
        array_push($bookmarks, array(
            'scope' => $identobj['scope'],
            'cemetery' => $identobj['cemetery'],
            'section' => ( isset($identobj['section']) ? $identobj['section'] : ''),
            'grave' => ( isset($identobj['grave']) ? $identobj['grave'] : '') 
        ));

        # save data
        return file_put_contents($bmfp, json_encode($bookmarks, JSON_PRETTY_PRINT) );
    }

    public function delete_bookmark($data) {
        $bmfp = $this->data . $data['id']['project'] . '/bookmarks.json';
        if( file_exists($bmfp) ) {
            $bookmarks = json_decode(file_get_contents( $bmfp ), true);
        } else {
            return true;
        }

        # delete
        unset($bookmarks[$data['bid']]);
        # To prevent associative array creation by unset-ing
        $bookmarks = array_values($bookmarks);

        # save data
        return file_put_contents($bmfp, json_encode($bookmarks, JSON_PRETTY_PRINT) );
    }

    # Delete a scope item (only grave for now/ever)
    public function delete_scope($data) {
        switch($data['scope']) {
            case 'grave':
                $gpath = $this->data . $data['id']['project'] . '/' . $data['id']['cemetery'] . '/' . $data['id']['section'] . '/' . $data['id']['grave'] . '/';

                # Move any photographs that may exist to the general unsorted photos
                $photos = $this->_list_files($gpath . 'photographs');
                for( $p = 0; $p < count($photos); $p += 1) {
                    rename($gpath . 'photographs/' . $photos[$p], $this->photo_dir . $photos[$p]);
                }
                $del_pdir = rmdir($gpath . 'photographs');
                $del_dfile = unlink($gpath . $data['id']['grave'] . '.json');
                $del_grave = rmdir($gpath);
                
                # everything is okay
                if( $del_pdir && $del_dfile && $del_grave ) {
                    return true;
                } else {
                    $this->send_error("Could not delete " . data['scope'] . " correctly");
                }
                break;

            default:
                $this->send_error("Deletion of scopes other than 'grave' is not implemented");

        }
    }
}

$wcsa = new wcsalib();
?>
