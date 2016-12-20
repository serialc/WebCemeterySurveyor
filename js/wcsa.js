
// Global object is potentially defined elsewhere
if( typeof WCSA === 'undefined' ) {
    WCSA = {};
}

// Use the hash for navigation
window.onload = function() {
    switch(window.location.hash) {
        case '#bookmark':
            WCSA.show_bookmarks();
        break;

        case '#list':
            WCSA.show_scope_contents('');
        break;
    }
}

WCSA.base_path = document.URL.split('WCS')[0] + 'WCS/';

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
            window.location = '#list'
            location.reload();
        })
        .fail(function(e) {
            $('.error_msg', '#main_modal').html('Unable to submit due to ' + e);
        });
    });

    // Show the modal
    $('#main_modal').modal('toggle');
};

WCSA.new_grave = function(project, cemetery, section, id) {
    $.ajax({
        type: "POST",
        url: WCSA.base_path + "inc/new.php",
        data: {"type": 'new_scope_item', "scope": 'grave', "project": project, "cemetery": cemetery, "section": section, "grave": id}
    })
    .done(function() {
        window.location = '#list'
        location.reload();
    })
    .fail(function(e) {
        WCSA.error('Unable to submit due to ' + e);
        console.log(e);
    });
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
        WCSA.projectname = decodeURI(document.URL.split('WCS')[1].split('/')[2]);
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
                        // will use input for number
                        break;
                    case 'text':
                        // will use input for number
                        break;
                    default:
                        htmls += 'Bad data type for ' + item.title;
                }

                // dependency option. Only appears if this is a radio button and there is another group below it
                if( item.data_type === 'radio' && WCSA.survey[scope][tindex]['contents'].length > (gindex + 1) ) {
                    htmls += '<div class="row"><div class="col-md-6">';
                    htmls += WCSA.format_input('dependency', 'Dependency attribute', (item.dependency ? item.dependency : ''), 'e.g., ' + item.attributes.join(', '), 'text', 'Selection of this attribute will hide groups below');
                    htmls += '</div><div class="col-md-6">';
                    htmls += WCSA.format_input('dependency_num', 'Dependency groups hidden', (item.dependency_num ? item.dependency_num : ''), 'e.g., 1,2,3', 'number', 'The number of groups that will be hidden');
                    htmls += '</div></div>';
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
    var wb = document.getElementById('error_header'),
        wc = document.getElementById('error_header_content');

    wc.innerHTML = msg;
    wb.style.display = 'block';
    setTimeout(function() {$('#error_header').fadeOut('slow')}, 10000);

    // Need to make this show up for the user
    console.log(msg);
    // Show a header briefly with error message
};

WCSA.warn = function(msg) {
    var wb = document.getElementById('warn_header'),
        wc = document.getElementById('warn_header_content');

    wc.innerHTML = msg;
    wb.style.display = 'block';
    setTimeout(function() {$('#warn_header').fadeOut('slow')}, 10000);

    console.log(msg);
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
            
            // check that the target object is not empty
            if( WCSA.survey[scope] === undefined ) {
                WCSA.survey[scope] = [];
            }

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

                    case 'measurement':
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
        dataType: "json",
        url: WCSA.base_path + "inc/update_json.php",
        data: {"project": WCSA.get_projectname(), "survey": WCSA.survey}
    })
    .done(function(e) { })
    .fail(function(e) {
        WCSA.warn("The server complained with this data update: <br>" + e.responseText);
        console.log(e);
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

            WCSA.update_full_json_survey();
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

            WCSA.update_full_json_survey();
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
                // disable click event - otherwise we get modal freeze
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
};

WCSA.show_scope_survey = function(scope) {
    // ignores passed variable for now - but may be important in future
    $('.scope_list').hide()
    $('.scope_pics').hide();
    document.getElementById('pictures_footer').style.display = '';
    $('.scope_survey').show();
}

// Show the list of sub-items
WCSA.show_scope_contents = function(scope) {
    // ignores passed variable for now - but may be important in future
    $('.scope_survey').hide();
    $('.scope_pics').hide();
    $('.bookmarks_list').hide();
    document.getElementById('pictures_footer').style.display = '';
    $('.scope_list').show()
}

WCSA.show_bookmarks = function() {
    $('.scope_list').hide();
    $('.bookmarks_list').show();
};

WCSA.submit_input = function(elem, scope, project, cemetery, section, grave, data_type, name, value) {

    elem.parentNode.classList.remove('has-success');
    elem.parentNode.classList.remove('has-failure');

    $.ajax({
        type: "POST",
        dataType: "json", // need to respond with valid json response 
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
                dataType: "json", // need to respond with valid 
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
                $('.' + data_type + '_' + name).removeClass('selected');
                document.getElementById(name + '_' + value).classList.add('selected');
            }

            // update server JSON
            $.ajax({
                type: "POST",
                dataType: "json", // need to respond with valid json 
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

    // go to top
    scroll(0,0);

    // show this one
    document.getElementById(tid).style.display = 'block';
    elem.classList.add('selected');
};

WCSA.move_photo_between_feature = function(photoname, direction) {
    var unsorted_cont,
        htmlimg = document.getElementById(photoname);

    // This is only possible/enabled if the unsorted pictures folder is visible
    unsorted_cont = document.getElementById('unsorted_carousel');
    if( unsorted_cont.style.display === '' || unsorted_cont.style.display === 'none' ) {
        return;
    }

    $.ajax({
        type: "POST",
        dataType: "json",
        url: WCSA.base_path + "inc/move_photographs.php",
        data: {"id": WCSA.id, "direction": direction, "picture": photoname}
    })
    .done(function(msg) {
        // Move the photograph on the page with JS
        // Reinitialize the picture behaviours by reloading both strips/carousels
        WCSA.populate_unsortedpics(true); // true - reset/remove previous
        WCSA.populate_featurepics(true); // true - reset/remove previous
        //htmlimg = htmlimg.parentNode.removeChild(htmlimg)
        if( direction === 'unsorted' ) {
            // unsorted_carousel
            //document.getElementById('unsorted_carousel').prepend(htmlimg)

            // need to dissociate any attributes of this picture
            $.ajax({
                type: "POST",
                url: WCSA.base_path + "inc/associate_photo.php",
                dataType: "json",
                data:  {"action": "unlink", "picture": photoname, "id": WCSA.id}
            })
            .done(function(msg) {})
            .fail(function(e) { WCSA.warn(e); console.log(e); });

        }
        if( direction === 'scope' ) {
            // picture_carousel
            //document.getElementById('picture_carousel').prepend(htmlimg)
        }
    })
    .fail(function(e) {
        WCSA.warn(e);
        console.log(e);
    });
};

WCSA.toggle_unsortedpics = function() {
    var unsorted_cont,
        parent_cont,
        feature_cont,
        htmls = '';

    parent_cont = document.getElementById('pictures_footer');
    unsorted_cont = document.getElementById('unsorted_carousel');
    feature_cont = document.getElementById('picture_carousel');

    if( unsorted_cont.style.display === '' || unsorted_cont.style.display === 'none' ) {
        // Display the unsorted photographs and adjust the styling of the other carousel
        unsorted_cont.style.display = 'block';
        parent_cont.style.height = '600px';

        WCSA.populate_unsortedpics(false);

    } else {
        unsorted_cont.style.display = '';
        parent_cont.style.height = '300px';

        // delete all child nodes/pictures
        while (unsorted_cont.firstChild) {
            unsorted_cont.removeChild(unsorted_cont.firstChild);
        }
    }
};

WCSA.populate_unsortedpics = function(reset) {

    var unsorted_cont = document.getElementById('unsorted_carousel');
        htmls = '';


    if( reset ) {
        // delete all child nodes/pictures
        while (unsorted_cont.firstChild) {
            unsorted_cont.removeChild(unsorted_cont.firstChild);
        }
    }

    // Load the pictures list and display the thumbnails in 'picture_carousel'
    $.ajax({
        type: "GET",
        dataType: "json",
        url: WCSA.base_path + "inc/get_picture_list.php"
    })
    .done(function(data) {
        // Show the available images in the carrousel
        for(i = 0; i < data.length; i += 1) {
            photo_fp = WCSA.base_path + 'photographs/' + data[i];
            //htmls += '<img id="' + data[i] + '" onclick="WCSA.move_photo_between_feature(\'' + data[i] + '\', \'scope\')" ondblclick="WCSA.show_photo(\'' + photo_fp + '\',\'' + data[i] + '\')" title="Click to move up to feature. Double click to enlarge" src="' + photo_fp + '" draggable="true">';
            htmls += '<img id="' + data[i] + '" onclick="WCSA.move_photo_between_feature(\'' + data[i] + '\', \'scope\')" title="Click to move photograph to feature." src="' + photo_fp + '" draggable="true">';
        }
        unsorted_cont.innerHTML = htmls;
    })
    .fail(function(e) {
        WCSA.warn("Couldn't load list of unsorted photographs");
    });
};

WCSA.populate_featurepics = function(reset) {
    var target,
        elems,
        htmls = '',
        photo_fp,
        photo_dir,
        counter,
        i, 
        feature_cont = document.getElementById('picture_carousel');

    if( reset ) {
        // delete all child nodes/pictures
        while (feature_cont.firstChild) {
            feature_cont.removeChild(feature_cont.firstChild);
        }
    }

    // Load the pictures list for this scope feature and display the thumbnails in 'picture_carousel'
    $.ajax({
        type: "POST",
        url: WCSA.base_path + "inc/get_scope_pic_files.php",
        dataType: "json", 
        data: WCSA.id
    })
    .done(function(data) {
        counter = 0;

        photo_dir = WCSA.base_path;
        switch(WCSA.id.scope) {
            case 'cemetery':
                photo_dir += 'data/' + WCSA.id.project + '/' + WCSA.id.cemetery + '/photographs/';
            break;

            case 'section':
                photo_dir += 'data/' + WCSA.id.project + '/' + WCSA.id.cemetery + '/' + WCSA.id.section + '/photographs/';
            break;

            case 'grave':
                photo_dir += 'data/' + WCSA.id.project + '/' + WCSA.id.cemetery + '/' + WCSA.id.section + '/' + WCSA.id.grave + '/photographs/';
            break;
        }

        // Show the available images in the carrousel
        for(i = 0; i < data.length; i += 1) {
            photo_fp = photo_dir + data[i];
            htmls += '<img id="' + data[i] + '" onclick="WCSA.move_photo_between_feature(\'' + data[i] + '\', \'unsorted\')" ondblclick="WCSA.show_photo(\'' + photo_fp + '\',\'' + data[i] + '\')" title="Double click to enlarge" src="' + photo_fp + '" draggable="true">';
        }
        feature_cont.innerHTML = htmls;

        function prep_drop_targets() {
            // Prepare all the drag and drop functionality for the targets
            var idp,
                j,
                k,
                target,
                lasttarget,
                data,
                thumbnail,
                DDenter, DDover, DDdrop, DDleave,
                targets = document.getElementsByClassName('dropzone');

                // DRAGENTER
                DDenter = function( event ) {
                    counter += 1;
                    this.style.borderColor = 'green';
                    this.style.borderStyle = 'solid';

                    // Bubble up to get the id of the dragzone element
                    target = event.target;
                    for( k = 0; k < 3; k += 1 ) {
                        if( !target.classList || !target.classList.contains('dropzone') ) {
                            // overwrite with parent
                            target = target.parentNode;
                            continue;
                        }
                        // found it
                        break;
                    }

                    // See if this is the dropzone as the last, reset the last one if not
                    if( lasttarget !== target && lasttarget !== undefined ) {
                        lasttarget.style.borderColor = '';
                        lasttarget.style.borderStyle = '';
                    }
                    lasttarget = target;
                };
                
                // DRAGOVER
                DDover = function( event ) {
                    event.preventDefault();
                }

                // DROP
                DDdrop = function( event ) {
                    // prevent URL follow
                    event.preventDefault();

                    // retrieve data passed on dragstart and process it

                    // Bubble up to get the id of the dragzone element
                    target = event.target;
                    for( k = 0; k < 3; k += 1 ) {
                        // Shouldn't be any farther than 2 jumps...
                        if( !target.classList || !target.classList.contains('dropzone') ) {
                            // overwrite with parent
                            target = target.parentNode;
                            continue;
                        }
                        // found it
                        break;
                    }

                    // remove highlights
                    this.style.borderColor = '';
                    this.style.borderStyle = '';

                    // ask the server to move the image to this scope's picture folder
                    // Also add data to this scopes data file with the file name and associated NAME and, possible ATTRIBUTE
                    idp = target.id.split(':::');
                    if( idp.length === 2 ) {
                        data = {"action": "associate", "picture": event.dataTransfer.getData('text'), "id": WCSA.id, "name": idp[0], "attribute": idp[1]};
                    } else {
                        data = {"action": "associate", "picture": event.dataTransfer.getData('text'), "id": WCSA.id, "name": idp[0]};
                    }

                    $.ajax({
                        type: "POST",
                        url: WCSA.base_path + "inc/associate_photo.php",
                        dataType: "json", 
                        data: data
                    })
                    .done(function(e) {
                        // On successful move
                        // Remove picture from picture_carousel
                        //thumbnail = document.getElementById(event.dataTransfer.getData('text'));
                        //thumbnail.parentNode.removeChild(thumbnail);
                    })
                    .fail(function(e) {
                        WCSA.error("Unable to move photograph to associate it with this feature: " + e.responseText);     
                    })
                };

                // DRAGLEAVE
                DDleave = function( event ) {
                    counter -= 1;
                    if( counter === 0 ) {
                        this.style.borderColor = '';
                        this.style.borderStyle = '';
                    }
                };

            // Make all potential targets highlighted
            for(j = 0; j < targets.length; j += 1) {
                targets[j].classList.add('active_dz')

                targets[j].addEventListener('dragenter',  DDenter, false);
                targets[j].addEventListener('dragover',  DDover, false); // important, otherwise 'drop' will not be called/captured
                targets[j].addEventListener('drop',  DDdrop, false);
                targets[j].addEventListener('dragleave',  DDleave, false);
            }

            // Listen for global 'drop' to undo highlights and removeEventListeners!
            document.addEventListener('drop', function(event) {
                // prevent URL follow
                event.preventDefault();
                // hide highlights for all possible targets
                for(j = 0; j < targets.length; j += 1) {
                    targets[j].classList.remove('active_dz')
                    targets[j].removeEventListener('dragenter',  DDenter, false);
                    targets[j].removeEventListener('dragover',  DDover, false);
                    targets[j].removeEventListener('drop',  DDdrop, false);
                    targets[j].removeEventListener('dragleave',  DDleave, false);
                }
                // need to reset counter as we possible dropped inside a cell (counter !== 0)
                counter = 0;
            }, false);

            // necessary for global drop to be caught above
            document.addEventListener('dragover', function(event) {
                event.preventDefault();
            }, false);
        }

        // Go through all the draggable imgs and add dragstart to them
        elems = feature_cont.children;
        for(i = 0; i < elems.length; i += 1) {
            elems[i].addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('text', this.id);
                prep_drop_targets();
            }, false);
        }
    })
    .fail(function(e) {
        console.log(e);
        WCSA.error("Unable to update data on server.");
    });
};

WCSA.toggle_featurepics= function() {

    var parent_cont = document.getElementById('pictures_footer'),
        feature_cont = document.getElementById('picture_carousel');

    if( parent_cont.style.display === '' || parent_cont.style.display === 'none' ) {
        parent_cont.style.display = 'block';

        WCSA.populate_featurepics(false);

    } else {
        parent_cont.style.display = 'none';

        // delete all child nodes/pictures
        while (feature_cont.firstChild) {
            feature_cont.removeChild(feature_cont.firstChild);
        }
    }
};

WCSA.unlink_photograph = function(filename) {
    var elem;

    $.ajax({
        type: "POST",
        url: WCSA.base_path + "inc/associate_photo.php",
        dataType: "json",
        data:  {"action": "unlink", "picture": filename, "id": WCSA.id}
    })
    .done(function(e) {
        // On successful move
        // Remove picture from picture_carousel
        elem = document.getElementById(filename);
        elem.parentNode.removeChild(elem);
    })
    .fail(function(e) {
        WCSA.error("Unable to unlink this photograph: " + e.responseText);     
        console.log(e);
    });
};

WCSA.show_scope_pictures = function() {
    var picont,
        pic,
        photo_fp,
        htmls;

    // Display and hide content appropriately
    $('.scope_list').hide()
    $('.scope_survey').hide()
    document.getElementById('pictures_footer').style.display = ''; // Hidden by default
    $('.scope_pics').show();

    // ajax call to load current pictures
    // Needs to be asynchronous as the data may have changed on the survey page
    $.ajax({
        type: "POST",
        url: WCSA.base_path + "inc/get_scope_pic_list.php",
        dataType: "json", 
        data: WCSA.id
    })
    .done(function(data) {
        // target to generate pics within
        picont = document.getElementById('scope_pics_contents');

        if( jQuery.isEmptyObject(data) ) {
            picont.innerHTML = '<div class="col-xs-12">No pictures</div>';
        } else {
            htmls = '';
            for(pic in data) {
                photo_fp = WCSA.base_path + 'data/' + WCSA.id.project +'/' + WCSA.id.cemetery +
                    (WCSA.id.section ? '/' + WCSA.id.section : '') +
                    (WCSA.id.grave ? '/' + WCSA.id.grave : '') + 
                    '/photographs/' + pic;

                htmls += '<div id="' + pic + '" class="col-lg-3 col-md-4 col-sm-6 col-xs-12"><div class="row"><div class="col-xs-12 text-xs-center">';
                htmls += '<img class="thumbnail" title="Double click to enlarge" ondblclick="WCSA.show_photo(\'' + photo_fp + '\',\'' + pic + '\')" src="' + photo_fp + '">';
                htmls += '<div class="photo_info">' + data[pic].name + (data[pic].attribute ? ': ' + data[pic].attribute : '') + '</div>';
                htmls += '<button type="button" title="Remove photograph link to this item" class="btn btn-warning photo_rem" onclick="WCSA.unlink_photograph(\'' + pic + '\')"><i class="fa fa-unlink" aria-hidden="true"></i></button>';
                htmls += '</div></div></div>';
            }
            picont.innerHTML = htmls;
        }
    })
    .fail(function(e) {
        WCSA.error("Could not retrieve photographs list: " + e);
    })
};

WCSA.show_photo = function(photo_path, name) {
    $('.modal-title', '#main_modal').html('<h2>' + name + '</h2>');
    $('.modal-body', '#main_modal').html('<img id="zoom_image" src="' + photo_path + '" width="100%" data-zoom-image="' + photo_path + '">');
    $('.btn-primary', '#main_modal').hide();
    // Show the modal
    $('#main_modal').modal('toggle');

    $("#zoom_image").elevateZoom({
        zoomWindowPosition: 1,
        zoomWindowOffetx: 10
    });
};

WCSA.bookmark = function() {
    var e = document.getElementsByClassName('fa-bookmark-o');

    // change the bookmark symbol to show it has been clicked
    if( e.length > 0 ) {
        e[0].classList.add('fa-bookmark');
        e[0].classList.remove('fa-bookmark-o');
    }

    $.ajax({
        type: "POST",
        dataType: "json",
        url: WCSA.base_path + "inc/bookmark.php",
        data: {"op": "new", "data": WCSA.id}
    })
    .done(function(msg) {})
    .fail(function(e) {
        console.log(e);
        WCSA.error("Unable to save bookmark due to: " + e);
    });
};

WCSA.delete_bookmark = function(id) {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: WCSA.base_path + "inc/bookmark.php",
        data: {"op": "delete", "data": {"bid": id, "id": WCSA.id} }
    })
    .done(function(msg) {
        window.location = '#bookmark'
        location.reload();
    })
    .fail(function(e) {
        WCSA.error("Unable to delete bookmark due to: " + e);
    });
}

WCSA.delete_scope = function(scope) {

    $('.modal-title', '#main_modal').html('<h2>Are you sure you want to delete this ' + scope + '?</h2>');
    $('.modal-body', '#main_modal').html('<p>This deletion cannot be undone</p>');

    // on submit handler
    $('.btn-primary', '#main_modal').html('Delete').click(function() {
        // delete from server
        $.ajax({
            type: "POST",
            dataType: "json", // need to respond with valid json 
            url: WCSA.base_path + "inc/delete_scope.php",
            data: {"scope": scope,
                "id": WCSA.id
            }
        })
        .done(function(msg) {
            window.location = WCSA.base_path + 'surveys/' + WCSA.id.project + '/cemeteries/' + WCSA.id.cemetery + '/sections/' + WCSA.id.section;
        })
        .fail(function(e) {
            WCSA.error('Unable to delete ' + scope);
            console.log(e);
        });

        // hide the modal
        $('#main_modal').modal('toggle');

        // go back to higher level scope

    });

    // After the modal appears do the following...
    $('#main_modal').on('hidden.bs.modal', function () {
        // disable click event - otherwise we get modal freeze next time we use the modal
        $('.btn-primary', '#main_modal').html('Submit').off('click');
    });

    // Show the modal
    $('#main_modal').modal('toggle');
};

WCSA.toggle_dependency_visibility = function(attrib_id, group_id, group_num) {
    var new_state,
        target_group,
        target_group_id;

    // Do we show or hide the dependent group?
    if( document.getElementById(attrib_id).classList.contains('selected') ) {
        // hide the target group
        new_state = 'none';
    } else {
        // show the target group
        new_state = '';
    }

    // Check the number is sane
    if(group_num === '' || group_num < 1 ) {
        WCSA.error("Group dependency question has an invalid number of groups number to hide: " + group_num + ". Edit your survey and set it to an integer greater than 0.");
        return;
    }

    // Go through the groups hiding or showing them
    for( target_group_id = group_id + 1; target_group_id <= group_id + group_num; target_group_id += 1 ) {
        document.getElementById('group_' + target_group_id).style.display = new_state;
    }
};
