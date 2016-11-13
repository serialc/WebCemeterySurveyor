
// Global object is defined elsewhere potentially
if( typeof WCSA === 'undefined' ) {
    WCSA = {};
}

WCSA.base_path = document.URL.split('WCS')[0] + 'WCS/';

var dragged;



WCSA.new_scope_item = function(scope, project, cemetery, section) {
var html;

htmls = '<form onsubmit="return false">' + 
'<input type="hidden" id="type" name="type" value="new_scope_item">' +
        '<input type="hidden" id="scope" name="scope" value="' + scope + '">' +
        '<input type="hidden" id="project" name="project" value="' + project + '">';

    switch(scope) {
        case 'cemetery':
            htmls += WCSA.format_input('cemetery', 'Name:', '', 'e.g., Walferdange, Belval', 'text', '');
            break;

        case 'section':
            htmls += WCSA.format_input('section', 'Name:', '', 'e.g., North, East', 'text', '') +
                '<input type="hidden" id="cemetery" name="cemetery" value="' + cemetery + '">';
            break;

        case 'grave':
            // The grave isn't using a modal. It should simply autoincrement the integer of the grave id
            // Below is wrong!
            htmls += WCSA.format_input('grave', 'Name:', '', 'e.g., 1, 2b, 3top', 'text', '') +
                '<input type="hidden" id="cemetery" name="cemetery" value="' + cemetery + '">' +
                '<input type="hidden" id="section" name="section" value="' + section + '">';
            
            break;

        default:
            WCSA.error("Did not find relevant scope in new_scope_item().");
    }

    htmls += '</form>';

    $('.modal-title', '#main_modal').html('<h2>Create a new ' + scope + '</h2>');
    $('.modal-body', '#main_modal').html(htmls);

    // After the modal appears do the following...
    $('#main_modal').on('shown.bs.modal', function () {
        $('#' + scope, '#main_modal').focus();
    });

    // on submit handler
    $('.btn-primary', '#main_modal').html('Submit').click(function() {
        $.ajax({
            type: "POST",
            url: WCSA.base_path + "inc/new.php",
            data: $('#main_modal form').serialize()
        })
        .done(function() {
            // hide the modal
            $('#main_modal').modal('toggle');
            // disable click
            $('.btn-primary', '#main_modal').html('Submit').off('click');
            location.reload();
        })
        .fail(function(e) {
            $('.error_msg', '#main_modal').html('Unable to submit due to ' + e);
        });
    });

    // Show the modal
    $('#main_modal').modal('toggle');
};

WCSA.new_survey = function() {
    $('.modal-title', '#main_modal').html('<h2>Create a new survey project</h2>');
    $('.modal-body', '#main_modal').html(
        '<form onsubmit="return false">' + 
        '<input type="hidden" id="type" name="type" value="new_survey">' +
        WCSA.format_input('new_survey_name', 'New survey project name:', '', 'e.g., Main, Luxembourg, GR', 'text', '') +
        '</form>');

    // After the modal appears do the following...
    $('#main_modal').on('shown.bs.modal', function () {
        $('#new_survey_name', '#main_modal').focus();
    });

    // on submit handler
    $('.btn-primary', '#main_modal').html('Submit').click(function() {
        $.ajax({
            type: "POST",
            url: WCSA.base_path + "inc/new.php",
            data: $('#main_modal form').serialize()
        })
        .done(function() {
            // hide the modal
            $('#main_modal').modal('toggle');
            // disable click
            $('.btn-primary', '#main_modal').html('Submit').off('click');
            location.reload();
        })
        .fail(function(e) {
            $('.error_msg', '#main_modal').html('Unable to submit due to ' + e);
        });
    });

    // Show the modal
    $('#main_modal').modal('toggle');
};

WCSA.update_survey_question = function(project, scope, tindex, gindex, qindex, that) {
    var i,
        data_type,
        formdata = $(that.parentNode).serializeArray();

    //console.log(formdata);

    //console.log( WCSA.survey[scope][tindex]['contents'][gindex]['contents'][qindex] );
    for( i = 0; i < formdata.length; i += 1 ) {
        // get the data type, important for some of the other following inputs
        if( formdata[i].name === 'data_type' ) {
            data_type = formdata[i].value;
        }
        // convert comma seperated list to array (only if not a thumbnail!)
        if( formdata[i].name === 'attributes' ) {
            if( data_type !== 'set_thumbnail' && data_type !== 'radio_thumbnail') {
                formdata[i].value = formdata[i].value.split(',');
            }
        }
        // convert required 'on' to true/false
        if( formdata[i].name === 'required' ) {
            formdata[i].value = formdata[i].value;
        }
        // convert camera option 'on' to true/false
        if( formdata[i].name === 'camera' ) {
            formdata[i].value = formdata[i].value;
        }
        // convert attrib_camera option 'on' to true/false
        if( formdata[i].name === 'attrib_camera' ) {
            formdata[i].value = formdata[i].value;
        }

        WCSA.survey[scope][tindex]['contents'][gindex]['contents'][qindex][formdata[i].name] = formdata[i].value;
    }

    // update the local json data
    //console.log( WCSA.survey[scope][tindex]['contents'][gindex]['contents'][qindex] );

    // close the question html visibility
    WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex + '_' + qindex, 'squest');

    // update the server json data
    WCSA.update_full_json_survey();
};

WCSA.get_projectname = function() {
    if( !WCSA.projectname ) {
        WCSA.projectname = document.URL.split('WCS')[1].split('/')[2];
    }
    return WCSA.projectname;
};

WCSA.survey_toggle_stgq_view = function(event, uid, hierarch) {
    // uid is our hierarchical identifier
    // hierarch tells us either: sscope, stab, sgroup, squest
    var eyeicon, uidparts, item,
        surveyfrag,
        htmls = '',
        scope,
        tindex,
        gindex,
        qindex;

    //console.log("Requested to view/hide item: " + uid + ',' + hierarch);

    if(event !== null) {
        event.stopPropagation();
    }

    eyeicon = document.getElementById('eye_icon_' + uid);
    contents = document.getElementById(uid + '_contents');

    // If scope/tab/group/question contents are NOT visible
    if( eyeicon.className === 'fa fa-eye' ) {
        // Show contents
        eyeicon.className = 'fa fa-eye-slash';

        // Generate the Tabs, Groups or Questions as appropriate
        uidparts = uid.split('_');
        switch( hierarch ) {
            case 'sscope':
                // show tabs
                scope = uidparts[0];
                surveyfrag = WCSA.survey[scope];

                for( tindex = 0; tindex < surveyfrag.length; tindex += 1 ) {
                    item = surveyfrag[tindex];
                    htmls += WCSA.build_survey_html_item(scope, uid + '_' + tindex, hierarch, item);
                }
            break;

            case 'stab':
                // show groups
                scope = uidparts[0];
                tindex = uidparts[1];
                surveyfrag = WCSA.survey[scope][tindex]['contents'];

                // if surveyfrag is undefined, there are no contents so exit question list generation
                if( !surveyfrag ) {
                    return false;
                }
                for( gindex = 0; gindex < surveyfrag.length; gindex += 1 ) {
                    item = surveyfrag[gindex];
                    htmls += WCSA.build_survey_html_item(scope, uid + '_' + gindex, hierarch, item);
                }
            break;

            case 'sgroup':
                // show questions
                scope = uidparts[0];
                tindex = uidparts[1];
                gindex = uidparts[2];
                surveyfrag = WCSA.survey[scope][tindex]['contents'][gindex]['contents'];

                // if surveyfrag is undefined, there are no contents so exit question list generation
                if( !surveyfrag ) {
                    return false;
                }
                for( qindex = 0; qindex < surveyfrag.length; qindex += 1 ) {
                    item = surveyfrag[qindex];
                    htmls += WCSA.build_survey_html_item(scope, uid + '_' + qindex, hierarch, item);
                }
            break;

            case 'squest':
                // show  question form
                scope = uidparts[0];
                tindex = uidparts[1];
                gindex = uidparts[2];
                qindex = uidparts[3];
                item = WCSA.survey[scope][tindex]['contents'][gindex]['contents'][qindex];
                //console.log(item);
                //console.log(contents);

                // Question structure/components form
                htmls = '<div class="row sqform"><div class="col-xs-12"><form>';

                // hidden inputs
                htmls += '<input type="hidden" id="_type" name="_type" value="category">';
                htmls += '<input type="hidden" id="data_type" name="data_type" value="' + item.data_type + '">';

                htmls += WCSA.format_input('title', 'Title', item.title, 'Question title for user', 'text', false);
                htmls += WCSA.format_input('name', 'Short name', item.name , 'Question variable name for analysis', 'text', 'Be specific and use no spaces - underscores are recommended. This will be the variable name used for analysis.');

                if( !item.attributes ) {
                    item.attributes = [];
                }
                
                switch(item.data_type) {
                    case 'set':
                        htmls += WCSA.format_input('attributes', 'Attribute options', item.attributes.join(','), 'Comma separated list of values', 'text', 'Separate attribute options by a comma.');
                        break;
                    case 'set_thumbnail':
                        htmls += WCSA.format_input('attributes', 'Image folder name', item.attributes, 'e.g., decoration_crosses, grave_headstones', 'text', 'Folder name containing pictures. Do not use spaces.');
                        break;

                    case 'radio':
                        htmls += WCSA.format_input('attributes', 'Attribute options', item.attributes.join(','), 'Comma separated list of values', 'text', 'Separate attribute options by a comma.');
                        break;
                    case 'radio_thumbnail':
                        htmls += WCSA.format_input('attributes', 'Image folder name', item.attributes, 'e.g., decoration_crosses, grave_headstones', 'text', 'Folder name containing pictures. Do not use spaces.');
                        break;
                    case 'binary':
                        // uses true/false, no input needed
                        break;
                    case 'measurement':
                        // simple input for number
                        break;
                    case 'text':
                        // simple input for text
                        break;
                    default:
                        htmls += 'Bad data type for ' + item.title;
                }

                // camera
                htmls += WCSA.format_radio_input('Allow camera/picture linking for this question', 'camera', 'camera', [true, false], ['Yes', 'No'], (item.camera === 'true' || item.camera === true), true);

                // attrib_camera - only available for some data_types
                if( ['set', 'set_thumbnail', 'radio', 'radio_thumbnail'].indexOf(item.data_type) > -1 ) {
                    htmls += WCSA.format_radio_input('Allow camera/picture linking to individual attributes', 'attrib_camera', 'attrib_camera', [true, false], ['Yes', 'No'], (item.attrib_camera === 'true' || item.attrib_camera === true), true);
                }

                // required
                htmls += WCSA.format_radio_input('Required', 'required', 'required', [true, false], ['Yes', 'No'], (item.required === 'true' || item.required === true), true);

                // submission
                htmls += '<button type="button" class="btn btn-primary" onclick="WCSA.update_survey_question(\'' + WCSA.get_projectname() + '\',\'' + scope + '\',' + tindex + ',' + gindex + ',' + qindex + ', this)">Update question</button>';
                // close form
                htmls += '</form></div></div>';

                // close question
                htmls += '</div>'; 

            break;

            default:
                WCSA.error("Unexpected request in survey_toggle_stgq_view()");
        }

        // Add the generated HTML
        contents.innerHTML = htmls;

    } else {
        // If scope/tab/group/question contents are ALREADY visible, hide/delete contents
        // Hide/destroy contents
        eyeicon.className = 'fa fa-eye';
        
        // delete all child nodes
        while (contents.firstChild) {
            contents.removeChild(contents.firstChild);
        }
    }
};

// Generates HTML for survey editing page
WCSA.build_survey_html_item = function(scope, uid, hierarchylvl, item) {
    var uidparts = uid.split('_'),
        htmls = '';

    switch(hierarchylvl) {
        case 'sscope':

            htmls += '<div id="tab_' + uid + '" class="row stab">' +
                '<div class="col-xs-12" onclick="WCSA.survey_toggle_stgq_view(event, \'' + uid + '\', \'stab\')"><div class="row">' +
                '<div class="col-xs-6" id="tab_title_' + uid + '">Tab';
            
            // Add correct title
            if( item.title && item.title !== '' ) {
                htmls += ' - ' + item.title;
            }
            htmls += '</div>';

            // Add icons
            htmls += '<div class="col-xs-6 text-xs-right">' + 
                '<i id="eye_icon_' + uid + '" class="fa fa-eye" aria-hidden="true" title="Show/hide tab contents"></i> ' + 
                '<i class="fa fa-chevron-up" onclick="WCSA.move_survey_item(event, \'up\', \'stab\', \'' + uid + '\')" aria-hidden="true" title="Move tab up"></i> ' + 
                '<i class="fa fa-chevron-down" onclick="WCSA.move_survey_item(event, \'down\', \'stab\', \'' + uid + '\')" aria-hidden="true" title="Move tab down"></i> ' + 
                '<i class="fa fa-pencil" onclick="WCSA.edit_survey_item_title(event, \'' + uid + '\')" aria-hidden="true" title="Edit tab title"></i> ' +
                '<i class="fa fa-plus" onclick="WCSA.new_survey_item(event, \'' + uid + '\')" aria-hidden="true" title="Create new group"></i> ' + 
                '<i class="fa fa-trash" onclick="WCSA.delete_survey_item(event, \'' + uid + '\')" aria-hidden="true" title="Delete this empty tab"></i>' +
                '</div>';

            // close title bar/heading and icons
            htmls += '</div></div>'; 

            // provide containter for group contents for each tab
            htmls += '<div id="' + uid + '_contents" class="col-xs-12"></div>';

            // end of tab super item
            htmls += '</div>';

            break;

        case 'stab':

            htmls += '<div id="group_' + uid + '" class="row sgroup">' +
                '<div class="col-xs-12" onclick="WCSA.survey_toggle_stgq_view(event, \'' + uid + '\', \'sgroup\')"><div class="row">' +
                '<div class="col-xs-6" id="group_title_' + uid + '">Group';

            // Add correct title
            if( item.title && item.title !== '' ) {
                htmls += ' - ' + item.title;
            }
            htmls += '</div>';

            // Add icons
            htmls += '<div class="col-xs-6 text-xs-right">' + 
                '<i id="eye_icon_' + uid + '" class="fa fa-eye" aria-hidden="true" title="Show/hide group contents"></i> ' + 
                '<i class="fa fa-chevron-up" onclick="WCSA.move_survey_item(event, \'up\', \'sgroup\', \'' + uid + '\')" aria-hidden="true" title="Move group up"></i> ' + 
                '<i class="fa fa-chevron-down" onclick="WCSA.move_survey_item(event, \'down\', \'sgroup\', \'' + uid + '\')" aria-hidden="true" title="Move group down"></i> ' + 
                '<i class="fa fa-pencil" onclick="WCSA.edit_survey_item_title(event, \'' + uid + '\')" aria-hidden="true" title="Edit group title"></i> ' +
                '<i class="fa fa-plus" onclick="WCSA.new_survey_item(event, \'' + uid + '\')" aria-hidden="true" title="Create new question"></i> ' +
                '<i class="fa fa-trash" onclick="WCSA.delete_survey_item(event, \'' + uid + '\')" aria-hidden="true" title="Delete this empty group"></i>' +
                '</div>';

            // close title bar/heading and icons
            htmls += '</div></div>'; 

            // provide containter for group contents for each group 
            htmls += '<div id="' + uid + '_contents" class="col-xs-12"></div>';

            // end of group super item
            htmls += '</div>';

            break;

        case 'sgroup':

            htmls += '<div id="quest_' + uid + '" class="row squest">' +
                '<div class="col-xs-12" onclick="WCSA.survey_toggle_stgq_view(event, \'' + uid + '\', \'squest\')"><div class="row">' +
                '<div class="col-xs-6" id="quest_title_' + uid + '">' + item.title + ' [' + item.data_type + ']</div>';

            // Add icons
            htmls += '<div class="col-xs-6 text-xs-right">' + 
                '<i id="eye_icon_' + uid + '" class="fa fa-eye" aria-hidden="true" title="Show/hide question"></i> ' + 
                '<i class="fa fa-chevron-up" onclick="WCSA.move_survey_item(event, \'up\', \'squest\', \'' + uid + '\')" aria-hidden="true" title="Move question up"></i> ' + 
                '<i class="fa fa-chevron-down" onclick="WCSA.move_survey_item(event, \'down\', \'squest\', \'' + uid + '\')" aria-hidden="true" title="Move question down"></i> ' + 
                '<i class="fa fa-pencil" aria-hidden="true" title="Edit survey question"></i> ' +
                '<i class="fa fa-spacer-s"></i> ' +
                '<i class="fa fa-trash" onclick="WCSA.delete_survey_item(event, \'' + uid + '\')" aria-hidden="true" title="Delete this question"></i>' +
                '</div>';

            // close title bar/heading and icons
            htmls += '</div></div>'; 

            // provide containter for question contents for each question 
            htmls += '<div id="' + uid + '_contents" class="col-xs-12"></div>';

            // end of group super item
            htmls += '</div>';

            break;

        default:
            WCSA.error("Unexpected hierarchy type in build_survey_html_item()");
    }
    return(htmls);
}

WCSA.format_input = function(name, title, value, placeholder, type, helptip) {
    var htmls;

    // Build input string
    htmls = '<div class="form-group">' +
        '<label for="' + name + '">' + title + '</label>' + 
        '<input type="' + type + '" class="form-control" id="' + name + '" name="' + name + '" value="' + value + '" placeholder="' + placeholder + '">' + 
        '<div class="form-control-feedback"></div>';
            
    // show help?
    if(helptip !== false) {
       htmls += '<small id="surveyhelp" class="form-text text-muted">' + helptip + '</small>';
    }
    htmls += '</div>'; 
    
    return(htmls);
};

WCSA.format_radio_input = function(title, idbase, name, value_array, label_array, value, inline) {
    var idnum,
        htmls = '<fieldset class="form-group">';

    if( inline === true ) {
        inline = 'form-check-inline';
    } else {
        inline = 'form-check';
    }

    if( value_array.length !== label_array.length ) {
        WCSA.error("Passed arrays in format_radio_input() not of equal lengths.");
        return false;
    }

    htmls += '<legend>' + title + '</legend>';

    for( idnum = 0; idnum < value_array.length; idnum += 1 ) {
        htmls += '<div class="' + inline + '">' +
            '<label class="form-check-label">' +
            '<input type="radio" id="' + idbase + '_' + idnum + '" name="' + name + '" value="' + value_array[idnum] + '" class="form-check-input"' + (value == value_array[idnum] ? ' checked' : '') + '> ' +
            label_array[idnum] +
            '</label>' +
            '</div>';
    }

    htmls += '</fieldset>';

    return htmls;
};

WCSA.get_survey = function(project, force) {
    // don't retrieve if already done
    if( WCSA.survey && !force) return true;

    $.ajax({
        type: "GET",
        url: WCSA.base_path + 'data/' + project + '/' + project + '.json',
        dataType: "json",
        cache: false
    })
    .done(function(data) {
        WCSA.survey = data;
        return true;
    })
    .fail(function(data) {
        WCSA.error("Could not retrieve JSON data from server: " + data);
        return false;
    });
};

// Update to show info to user in a 'friendly' way
WCSA.error = function(msg) {
    // Need to make this show up for the user
    console.log(msg)
    // Show a header briefly with error message
};

WCSA.warn = function(msg) {
    console.log(msg)
}

WCSA.move_survey_item = function(event, direction, hierarchylvl, uid) {
    var uidparts,
        scope,
        tindex,
        gindex,
        qindex,
        target_index,
        survfragment,
        node;

    // Stop click propagation up html tree
    event.stopPropagation();

    // check/retrive the survey data to global object WCSA.survey
    if( !WCSA.get_survey(WCSA.get_projectname()), false) {
        WCSA.error("Could not load survey.");
    }

    uidparts = uid.split('_');
    switch(hierarchylvl) {
        case 'stab':
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);

            if( tindex === 0 && direction === 'up') {
                // do nothing as we are already at the top
                return false;
            }
            if( tindex === (WCSA.survey[scope].length - 1) && direction === 'down') {
                // do nothing as we are already at the bottom
                return false;
            }

            // determine the target index
            if( direction === 'up' ) {
                target_index = tindex - 1;
            } else {
                target_index = tindex + 1;
            }

            // switch positions in data
            survfragment = WCSA.survey[scope][target_index];
            WCSA.survey[scope][target_index] = WCSA.survey[scope][tindex];
            WCSA.survey[scope][tindex] = survfragment;

            // refresh display of tabs by closing and reopening (it's efficient although it doesn't look it)
            WCSA.survey_toggle_stgq_view(null, scope, 'sscope');
            WCSA.survey_toggle_stgq_view(null, scope, 'sscope');

            break;

        case 'sgroup':
                scope = uidparts[0];
                tindex = parseInt(uidparts[1], 10);
                gindex = parseInt(uidparts[2], 10);

                if( gindex === 0 && direction === 'up') {
                    // do nothing as we are already at the top
                    return false;
                }
                if( gindex === (WCSA.survey[scope][tindex]['contents'].length - 1) && direction === 'down') {
                    // do nothing as we are already at the bottom
                    return false;
                }

                // determine the target index
                if( direction === 'up' ) {
                    target_index = gindex - 1;
                } else {
                    target_index = gindex + 1;
                }

                // switch positions in data
                survfragment = WCSA.survey[scope][tindex]['contents'][target_index];
                WCSA.survey[scope][tindex]['contents'][target_index] = WCSA.survey[scope][tindex]['contents'][gindex];
                WCSA.survey[scope][tindex]['contents'][gindex] = survfragment;

                // refresh display of tabs by closing and reopening (it's efficient although it doesn't look it)
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex, 'stab');
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex, 'stab');

            break;

        case 'squest':
                scope = uidparts[0];
                tindex = parseInt(uidparts[1], 10);
                gindex = parseInt(uidparts[2], 10);
                qindex = parseInt(uidparts[3], 10);

                if( qindex === 0 && direction === 'up') {
                    // do nothing as we are already at the top
                    return false;
                }
                if( qindex === (WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length - 1) && direction === 'down') {
                    // do nothing as we are already at the bottom
                    return false;
                }

                // determine the target index
                if( direction === 'up' ) {
                    target_index = qindex - 1;
                } else {
                    target_index = qindex + 1;
                }

                // switch positions in data
                survfragment = WCSA.survey[scope][tindex]['contents'][gindex]['contents'][target_index];
                WCSA.survey[scope][tindex]['contents'][gindex]['contents'][target_index] = WCSA.survey[scope][tindex]['contents'][gindex]['contents'][qindex]
                WCSA.survey[scope][tindex]['contents'][gindex]['contents'][qindex] = survfragment;

                // refresh display of tabs by closing and reopening (it's efficient although it doesn't look it)
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex, 'sgroup');
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex, 'sgroup');

            break;

        default:
            WCSA.error("Unexpected hierarchy type in move_survey_item()");
    }

    // update the data on the server
    WCSA.update_full_json_survey();
};

WCSA.edit_scope_item_name = function(scope, project, cemetery, section, grave) {
    $('.modal-title', '#main_modal').html('<h2>Edit name</h2>');

    // open a modal to edit the name
    switch(scope) {
        case 'cemetery':
            $('.modal-body', '#main_modal').html(
                '<form onsubmit="return false">' + 
                '<input type="hidden" id="scope" name="scope" value="' + scope + '">' +
                '<input type="hidden" id="project" name="project" value="' + project + '">' +
                '<input type="hidden" id="cemetery" name="cemetery" value="' + cemetery + '">' +
                WCSA.format_input('scope_name', 'Name:', cemetery, 'e.g., Main, Luxembourg, GR', 'text', '') +
                '</form>');

            break;

        case 'section':
            $('.modal-body', '#main_modal').html(
                '<form onsubmit="return false">' + 
                '<input type="hidden" id="scope" name="scope" value="' + scope + '">' +
                '<input type="hidden" id="project" name="project" value="' + project + '">' +
                '<input type="hidden" id="cemetery" name="cemetery" value="' + cemetery + '">' +
                '<input type="hidden" id="section" name="section" value="' + section + '">' +
                WCSA.format_input('scope_name', 'Name:', section, 'e.g., North, Fenced area, East', 'text', '') +
                '</form>');

            break;

        case 'grave':
            $('.modal-body', '#main_modal').html(
                '<form onsubmit="return false">' + 
                '<input type="hidden" id="scope" name="scope" value="' + scope + '">' +
                '<input type="hidden" id="project" name="project" value="' + project + '">' +
                '<input type="hidden" id="cemetery" name="cemetery" value="' + cemetery + '">' +
                '<input type="hidden" id="section" name="section" value="' + section + '">' +
                '<input type="hidden" id="grave" name="grave" value="' + grave + '">' +
                WCSA.format_input('scope_name', 'Name:', grave, 'e.g., 1B, 3C, 5top', 'text', '') +
                '</form>');

            break;

        default:
            WCSA.error("Unknown scope in edit_scope_item_name()");
    }

    // After the modal appears do the following...
    $('#main_modal').on('shown.bs.modal', function () {
        $('#scope_name', '#main_modal').focus();
    });

    // on submit handler
    $('.btn-primary', '#main_modal').html('Update').click(function() {
        $.ajax({
            type: "POST",
            url: WCSA.base_path + "inc/edit_scope_name.php",
            data: $('#main_modal form').serialize()
        })
        .done(function() {
            location.reload();
        })
        .fail(function(e) {
            $('.error_msg', '#main_modal').html('Unable to submit due to ' + e);
        });
    });

    // Show the modal
    $('#main_modal').modal('toggle');
};

WCSA.edit_survey_item_title = function(event, uid) {
    var uidparts,
        scope,
        tindex,
        heading,
        oldtitle,
        newtitle;

    // Stop click propagation up html tree
    event.stopPropagation();

    uidparts = uid.split('_');
    
    switch(uidparts.length) {
        // tab title
        case 2:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);

            heading = document.getElementById('tab_title_' + uid);
            oldtitle = WCSA.survey[scope][tindex].title;

            $('.modal-title', '#main_modal').html('<h2>Edit tab title</h2>');
            $('.modal-body', '#main_modal').html(
                '<form onsubmit="return false">' + 
                    '<input type="hidden" id="project" name="project" value="' + WCSA.get_projectname() + '">' +
                    '<input type="hidden" id="scope" name="scope" value="' + scope + '">' +
                    '<input type="hidden" id="tindex" name="tindex" value="' + tindex+ '">' +
                    '<div class="form-group">' + 
                        '<label for="title">Title:</label>' +
                        '<input type="text" class="form-control" id="title" value="' + oldtitle + '" name="title" placeholder="">' +
                    '</div>' +
                '</form>'
            );
    
            // After the modal appears do the following...
            $('#main_modal').on('shown.bs.modal', function () {
                $('#title', '#main_modal').focus();
            })

            // on submit handler
            $('.btn-primary', '#main_modal').html('Submit').click(function() {
                var datapkg = $('#main_modal form').serialize()
                $.ajax({
                    type: "POST",
                    url: WCSA.base_path + "inc/update_survey_title.php",
                    data: $('#main_modal form').serialize()
                })
                .done(function() {
                    // update the tab title in JS
                    newtitle = $('#title', '#main_modal').val();
                    if( newtitle === '' ) {
                        heading.innerHTML = 'Tab';
                    } else {
                        heading.innerHTML = 'Tab - ' + newtitle;
                    }

                    // update JSON data from server - force update
                    WCSA.get_survey(WCSA.get_projectname(), true);

                    // hide the modal
                    $('#main_modal').modal('toggle');
                    // disable click
                    $('.btn-primary', '#main_modal').html('Submit').off('click');
                })
                .fail(function(e) {
                    $('.error_msg', '#main_modal').html('Unable to submit due to ' + e);
                });
            });
            
            break;

        // group title
        case 3:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);
            gindex = parseInt(uidparts[2], 10);

            heading = document.getElementById('group_title_' + uid);
            oldtitle = WCSA.survey[scope][tindex]['contents'][gindex].title;

            $('.modal-title', '#main_modal').html('<h2>Edit group title</h2>');
            $('.modal-body', '#main_modal').html(
                '<form onsubmit="return false">' + 
                    '<input type="hidden" id="project" name="project" value="' + WCSA.get_projectname() + '">' +
                    '<input type="hidden" id="scope" name="scope" value="' + scope + '">' +
                    '<input type="hidden" id="tindex" name="tindex" value="' + tindex+ '">' +
                    '<input type="hidden" id="gindex" name="gindex" value="' + gindex+ '">' +
                    '<div class="form-group">' + 
                        '<label for="title">Title:</label>' +
                        '<input type="text" class="form-control" id="title" value="' + oldtitle + '" name="title" placeholder="">' +
                    '</div>' +
                '</form>'
            );

            // After the modal appears do the following...
            $('#main_modal').on('shown.bs.modal', function () {
                $('#title', '#main_modal').focus();
            })
    
            // After the modal appears do the following...
            $('.btn-primary', '#main_modal').html('Submit').click(function() {
                var datapkg = $('#main_modal form').serialize()
                $.ajax({
                    type: "POST",
                    url: WCSA.base_path + "inc/update_survey_title.php",
                    data: $('#main_modal form').serialize()
                })
                .done(function() {
                    // update the tab title in JS
                    newtitle = $('#title', '#main_modal').val();
                    if( newtitle === '' ) {
                        heading.innerHTML = 'Group';
                    } else {
                        heading.innerHTML = 'Group - ' + newtitle;
                    }

                    // update JSON data from server - force update
                    WCSA.get_survey(WCSA.get_projectname(), true);

                    // hide the modal
                    $('#main_modal').modal('toggle');
                    // disable click
                    $('.btn-primary', '#main_modal').html('Submit').off('click');
                })
                .fail(function(e) {
                    $('.error_msg', '#main_modal').html('Unable to submit due to ' + e);
                });
            });

            break;

        default:
            WCSA.error("Unexpected hierarchy type in edit_survey_item_title()");
    }

    // Show the modal
    $('#main_modal').modal('toggle');
};

WCSA.new_survey_item = function(event, uid) {
    var uidparts,
        scope,
        tindex,
        gindex;

    // Stop click propagation up html tree
    event.stopPropagation();

    uidparts = uid.split('_');

    switch(uidparts.length) {
        // Add a new tab
        case 1:
            scope = uidparts[0];
            
            // add new json tab object
            WCSA.survey[scope].push({
                "_type": "tab",
                "contents": [],
                "title": "New"
            });

            // update html
            WCSA.survey_toggle_stgq_view(null, uid, 'sscope');
            // Check if the new tab is visible or not
            if( document.getElementById('tab_' + uid + '_' + (WCSA.survey[scope].length - 1)) === null ) {
                // is now hidden so show it
                WCSA.survey_toggle_stgq_view(null, scope, 'sscope');
            }

            WCSA.update_full_json_survey();
            break;

        // Add a new group
        case 2:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);

            // if survey[scope][tindex] has no contents because of PHP, create it
            if( !WCSA.survey[scope][tindex]['contents']) {
                WCSA.survey[scope][tindex]['contents'] = [];
            }

            // add new group object
            WCSA.survey[scope][tindex]['contents'].push({
                "_type": "group",
                "contents": [],
                "title": "New"
            });

            // update html
            WCSA.survey_toggle_stgq_view(null, uid, 'stab');
            // Check if the new tab is visible or not
            if( document.getElementById('group_' + uid + '_' + (WCSA.survey[scope][tindex]['contents'].length - 1)) === null ) {
                // is now hidden so show it
                WCSA.survey_toggle_stgq_view(null, uid, 'stab');
            }

            WCSA.update_full_json_survey();
            break;

        // Add a new question
        case 3:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);
            gindex = parseInt(uidparts[2], 10);

            // Display a modal with options for question type
            $('.modal-title', '#main_modal').html('<h2>Add a new question to this group</h2>');
            $('.modal-body', '#main_modal').html(
                '<form onsubmit="return false">' + 
                WCSA.format_radio_input('Select question type:', 'qtype', 'qtype',
                    ['set', 'set_thumbnail', 'radio', 'radio_thumbnail', 'binary', 'measurement', 'text'],
                    ['Set', 'Set thumbnail', 'Radio', 'Radio thumbnail', 'Binary', 'Measurement', 'Text'],
                    '', false) +
                '</form>'
            );
            // After the modal appears do the following...
            $('#main_modal').on('shown.bs.modal', function () {
                // nothing
            })
            // on submit handler
            $('.btn-primary', '#main_modal').html('Create').click(function() {
                var qtype = $('#main_modal form').serializeArray();

                if( qtype.length === 0 ) {
                    return false;
                }

                // get the relevant part
                qtype = qtype[0]['value'];

                // Need to check if target has a contents array
                if( !WCSA.survey[scope][tindex]['contents'][gindex]['contents'] ) {
                    WCSA.survey[scope][tindex]['contents'][gindex]['contents'] = [];
                }
                
                // Create the question in the json survey
                switch(qtype) {
                    // Types: set, set_thumbnail, radio, radio_thumbnail, binary, measurement, text
                    case 'set':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "set",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "attributes": [],
                            "title": 'New question',
                            "required": false,
                            "camera": false,
                            "attrib_camera": false
                        });
                        break;

                    case 'set_thumbnail':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "set_thumbnail",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "attributes": [],
                            "title": 'New question',
                            "required": false,
                            "camera": false,
                            "attrib_camera": false
                        });
                        break;

                    case 'radio':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "radio",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "attributes": [],
                            "title": 'New question',
                            "required": false,
                            "camera": false,
                            "attrib_camera": false
                        });
                        break;

                    case 'radio_thumbnail':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "radio_thumbnail",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "attributes": [],
                            "title": 'New question',
                            "required": false,
                            "camera": false,
                            "attrib_camera": false
                        });
                        break;

                    case 'binary':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "binary",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "title": 'New question',
                            "required": false,
                            "camera": false
                        });
                        break;

                    case 'measurment':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "measurement",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "title": 'New question',
                            "required": false,
                            "camera": false
                        });
                        break;

                    case 'text':
                        WCSA.survey[scope][tindex]['contents'][gindex]['contents'].push({
                            "_type": "category",
                            "data_type": "text",
                            "name": 'temp_' + scope + '_' + tindex + '_' + gindex + '_' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length,
                            "title": 'New question',
                            "required": false,
                            "camera": false
                        });
                        break;

                    default:
                        WCSA.error('The question type was not found in new_survey_item().');

                }

                // show (or hide) the group contents, update html
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex, 'sgroup');

                // Check if the new question is visible or not
                if( document.getElementById('quest_' + uid + '_' + (WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length - 1)) === null ) {
                    // is now hidden so show it by making the same call
                    console.log('second call');
                    WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex, 'sgroup');
                }

                // update the data on the server
                WCSA.update_full_json_survey();
                
                // hide the modal
                $('#main_modal').modal('toggle');
                // disable click
                $('.btn-primary', '#main_modal').html('Submit').off('click');
            });

            // show the modal
            $('#main_modal').modal('toggle');

            break;
        default:
            WCSA.error("Unexpected request in survey_toggle_stgq_view()");
    };
};

// Update server JSON completely using this JS state
WCSA.update_full_json_survey = function() {

    $.ajax({
        type: "POST",
        //dataType: "json", // need to respond with valid json response and having trouble with this
        url: WCSA.base_path + "inc/update_json.php",
        data: {"project": WCSA.get_projectname(), "survey": WCSA.survey}
    })
    .done(function(e) {
    })
    .fail(function(e) {
        console.log(e);
        WCSA.error("Unable to update data on server.");
    });
};

WCSA.delete_survey_item = function(event, uid) {
    var uidparts;

    // Stop click propagation up html tree
    event.stopPropagation();

    uidparts = uid.split('_');
    switch(uidparts.length) {
        // Delete a tab
        case 2:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);

            // delete from json if empty
            if( WCSA.survey[scope][tindex]['contents'] !== undefined && WCSA.survey[scope][tindex]['contents'].length !== 0 ) {
                WCSA.warn('Cannot delete this tab as it is not empty. It contains ' + WCSA.survey[scope][tindex]['contents'].length + ' groups.');

                // show (or hide) the tab contents
                // Check if the contents are visible or not
                if( document.getElementById('group_' + uid + '_0') === null ) {
                    // is hidden, so show contents
                    WCSA.survey_toggle_stgq_view(null, uid, 'stab');
                }
                return false;
            }

            // delete
            WCSA.survey[scope].splice(tindex, 1);

            // update html
            WCSA.survey_toggle_stgq_view(null, scope, 'sscope');
            WCSA.survey_toggle_stgq_view(null, scope, 'sscope');

            break;

        // Delete a group
        case 3:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);
            gindex = parseInt(uidparts[2], 10);

            // delete from json if empty
            if( WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length !== 0 ) {
                WCSA.warn('Cannot delete this group as it is not empty. It contains ' + WCSA.survey[scope][tindex]['contents'][gindex]['contents'].length + ' questions.');

                // show (or hide) the group contents
                // Check if the contents are visible or not
                if( document.getElementById('quest_' + uid + '_0') === null ) {
                    // is hidden, so show contents
                    WCSA.survey_toggle_stgq_view(null, uid, 'sgroup');
                }
                return false;
            }

            // delete
            WCSA.survey[scope][tindex]['contents'].splice(gindex, 1);

            // update html
            WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex, 'stab');
            WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex, 'stab');

            break;

        // Delete a question
        case 4:
            scope = uidparts[0];
            tindex = parseInt(uidparts[1], 10);
            gindex = parseInt(uidparts[2], 10);
            qindex = parseInt(uidparts[3], 10);

            $('.modal-title', '#main_modal').html('<h2>Are you sure you want to delete this question?</h2>');
            $('.modal-body', '#main_modal').html('<p>This deletion cannot be undone</p>');

            // on submit handler
            $('.btn-primary', '#main_modal').html('Delete').click(function() {
                // delete from JSON
                WCSA.survey[scope][tindex]['contents'][gindex]['contents'].splice(qindex, 1);

                // hide the modal
                $('#main_modal').modal('toggle');

                // send the new JSON struct to the server
                WCSA.update_full_json_survey();
            });

            // After the modal appears do the following...
            $('#main_modal').on('hidden.bs.modal', function () {
                // disable click
                $('.btn-primary', '#main_modal').html('Submit').off('click');
                // update html
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex, 'sgroup');
                WCSA.survey_toggle_stgq_view(null, scope + '_' + tindex + '_' + gindex, 'sgroup');
            });

            // Show the modal
            $('#main_modal').modal('toggle');

            break;

        default:
            WCSA.error("Unexpected request in delete_survey_item()");

    }

    WCSA.update_full_json_survey();
};

WCSA.show_scope_survey = function(scope) {
    $('.scope_list').hide()
    $('.scope_pics').hide();
    $('.scope_survey').show();
}

WCSA.show_scope_contents = function(scope) {
    $('.scope_survey').hide();
    $('.scope_pics').hide();
    document.getElementById('pictures_footer').style.display = 'none';
    $('.scope_list').show()
}

WCSA.submit_input = function(elem, scope, project, cemetery, section, grave, data_type, name, value) {

    elem.parentNode.classList.remove('has-success');
    elem.parentNode.classList.remove('has-failure');

    $.ajax({
        type: "POST",
        dataType: "json", // need to respond with valid json response and having trouble with this
        url: WCSA.base_path + "inc/update_scope_cat.php",
        data: {"scope": scope,
            "project": project, 
            "cemetery": cemetery,
            "section": section,
            "grave": grave,
            "data_type": data_type,
            "name": name,
            "value": value}
        })
        .done(function(e) {
            // show the checkmark next to the input to show it is saved
            elem.parentNode.classList.add('has-success');
            setTimeout(function() {
                elem.parentNode.classList.remove('has-success');
            }, 3000);
        })
        .fail(function(e) {
            elem.parentNode.classList.add('has-failure');
            WCSA.error("Unable to update data on the server:" + e);
            console.log(e);
        });

}

WCSA.toggle_attribute = function(scope, project, cemetery, section, grave, data_type, name, value) {

    switch(data_type) {
        case 'set':
        case 'set_thumbnail':
            // toggle html 'selected', id is name + '_' + value
            if( document.getElementById(name + '_' + value).classList.contains('selected') ) {
                document.getElementById(name + '_' + value).classList.remove('selected');
            } else {
                document.getElementById(name + '_' + value).classList.add('selected');
            }

            // update server JSON
            $.ajax({
                type: "POST",
                //dataType: "json", // need to respond with valid json response and having trouble with this
                url: WCSA.base_path + "inc/update_scope_cat.php",
                data: {"scope": scope,
                    "project": project, 
                    "cemetery": cemetery,
                    "section": section,
                    "grave": grave,
                    "data_type": data_type,
                    "name": name,
                    "value": value}
            })
            .done(function(e) { })
            .fail(function(e) {
                console.log(e);
                WCSA.error("Unable to update data on server.");
            });
            
            break;

        case 'binary':
        case 'radio':
        case 'radio_thumbnail':
            // toggle html 'selected', id is name + '_' + value
            if( document.getElementById(name + '_' + value).classList.contains('selected') ) {
                document.getElementById(name + '_' + value).classList.remove('selected');
            } else {
                $('.radio_thumbnail_' + name).removeClass('selected');
                document.getElementById(name + '_' + value).classList.add('selected');
            }

            // update server JSON
            $.ajax({
                type: "POST",
                //dataType: "json", // need to respond with valid json response and having trouble with this
                url: WCSA.base_path + "inc/update_scope_cat.php",
                data: {"scope": scope,
                    "project": project, 
                    "cemetery": cemetery,
                    "section": section,
                    "grave": grave,
                    "data_type": data_type,
                    "name": name,
                    "value": value}
            })
            .done(function(e) { })
            .fail(function(e) {
                console.log(e);
                WCSA.error("Unable to update data on server.");
            });

            break;
    }
};

WCSA.show_tab_section = function(elem, tid) {
    // reset all
    $('.tabsection').hide();
    $('.ttitle').removeClass('selected');

    // show this one
    document.getElementById(tid).style.display = 'block';
    elem.classList.add('selected');
};

WCSA.toggle_camera = function() {
    var target,
        elems,
        htmls = '',
        i;
        
    target = document.getElementById('pictures_footer');

    if( target.style.display === '' || target.style.display === 'none' ) {
        target.style.display = 'block';

        // Load the pictures list and display the thumbnails in 'picture_carousel'
        $.ajax({
            type: "GET",
            dataType: "json",
            url: WCSA.base_path + "inc/get_picture_list.php"
        })
        .done(function(data) {
            target = document.getElementById('picture_carousel');
            for(i = 0; i < data.length; i += 1) {
                htmls += '<img id="' + data[i] + '" src="' + WCSA.base_path + 'photographs/' + data[i] + '" width="100" height="100" draggable="true">';
            }
            target.innerHTML = htmls;

            // Go through all the img and add drag star to them
            elems = target.children;
            for(i = 0; i < elems.length; i += 1) {
                elems[i].addEventListener('dragstart', function(event) {
                    event.dataTransfer.setData('application/json', data);
                }, false);

            }

            // Prepare all the drag and drop functionality
            // STILL NEED TO CUSTOMIZE THE TARGETS - replace document with... whatever it needs to be.
            elems = document.getElementsByClassName('dropzone');
            for(i = 0; i < elems.length; i += 1) {
                elems[i].classList.add('active_dz')
                elems[i].addEventListener('drop', function( event ) {
                    console.log(event);
                }, false);
            }

            /* events fired on the draggable target */
            //document.addEventListener("drag", function( event ) {
            //}, false);

            //document.addEventListener("dragstart", function( event ) {
                // store a ref. on the dragged elem
            //    dragged = event.target;
                // make it half transparent
            //    event.target.style.opacity = .5;
            //}, false);

            // What to do on drag end, such as being dropped outside of zone
            //document.addEventListener("dragend", function( event ) {
                //console.log('drag_end');
                //console.log(event);
            //}, false);

            /* events fired on the drop targets */
            //document.addEventListener("dragover", function( event ) {
                // prevent default to allow drop
            //    event.preventDefault();
            //    console.log(event.target);
            //}, false);

            document.addEventListener("dragenter", function( event ) {
                // highlight potential drop target when the draggable element enters it
                if ( event.target.className == "dropzone" ) {
                    event.target.style.background = "purple";
                }
            }, false);

            document.addEventListener("dragleave", function( event ) {
                // reset background of potential drop target when the draggable element leaves it
                if ( event.target.className == "dropzone" ) {
                    event.target.style.background = "";
                }
            }, false);

            document.addEventListener("drop", function( event ) {
                // prevent default action (open as link for some elements)
                event.preventDefault();
                // move dragged elem to the selected drop target
                if ( event.target.className == "dropzone" ) {
                    event.target.style.background = "";
                    dragged.parentNode.removeChild( dragged );
                    event.target.appendChild( dragged );
                }
            }, false);
        })
        .fail(function(e) {
            console.log(e);
            WCSA.error("Unable to update data on server.");
        });
    } else {
        target.style.display = 'none';
    }
};

WCSA.show_scope_pictures = function() {
    $('.scope_list').hide()
    $('.scope_survey').hide()
    document.getElementById('pictures_footer').style.display = 'none';
    $('.scope_pics').show();
}
