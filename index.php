<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Required meta tags always come first -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <!-- Fonts and other stuff -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="/WCS/css/bootstrap.min.css" integrity="sha384-2hfp1SzUoho7/TsGGGDaFdsuuDL0LX2hnUp6VkX3CUQ2K4K+xjboZdsXyp4oUHZj" crossorigin="anonymous">
    <link rel="stylesheet" href="/WCS/css/wcs.css">
    <link rel="stylesheet" href="/WCS/font-awesome-4.6.3/css/font-awesome.min.css">

    <title>WCS</title>

    <!-- Favicons -->
    <link rel="icon" href="/WCS/favicon.ico">

  </head>
  <body>
    <!-- <header class="navbar navbar-full navbar-light navbar-static-top"> -->
    <header class="navbar navbar-full navbar-light navbar-fixed-top">
        <div class="container correction">
            <nav class="navbar correction">
                <div class="nav navbar-nav">
<?php
date_default_timezone_set("UTC");

require('inc/wcsa.php');

# Provide appropriate header
$req = isset($_GET['request']) ? $_GET['request'] : '';

# Get the request parts
$reqp = explode('/', rtrim($req, '/'));

if ( $reqp[0] == '') {
    array_shift($reqp);
}

$reqlen = count($reqp);

if ( $reqlen == 0 ) {
    print("Survey projects");
} elseif ( $reqlen%2 == 0 ) {

    // print header
    $path_sep = ' / ';
    $buildup_path = $wcsa->basepath;

    # Make the sub heading text first then paste it in appropriately later
    $subheadtext = '<div class="nav-sub-title"><a href="' . $buildup_path . '"><i class="fa fa-home" aria-hidden="true"></i></a> ';

    for( $i = 1; $i < $reqlen; $i += 2) {
        # Add url path to each section
        $buildup_path .= $reqp[$i - 1] . '/' . $reqp[$i] . '/';
        $subheadtext .= '<a href="' . $buildup_path . '">' . $reqp[$i] . '</a>' . $path_sep;
    }

    # trim off the trainling separator ('/' or ':' or whtatever is being used as $path_sep)
    $subheadtext = rtrim($subheadtext, $path_sep);

    # close the sub heading
    $subheadtext .= '</div>';

    $headtext = 
        '<div class="nav-item">' .
        '<div class="nav-main-title">';

    # show other headings based on page/path
    if( $reqlen == 2 && $reqp[0] == 'editsurvey' ) {
        # A bit different for this one than the others
        $headtext .= 'Edit survey ' . $reqp[1] . '</div>' . 
            '<div class="nav-sub-title"><a href="' . $wcsa->basepath . '"><i class="fa fa-home" aria-hidden="true"></i></a> ' . 
            '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '">' . $reqp[1] . '</a>' .
            '</div></div>';
        $headtext .= '<div title="Cemeteries list" class="nav-item pull-xs-right pointer"><a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '"><i class="fa fa-th-large" aria-hidden="true"></i></a></div>';
        #$headtext .= '<div title="Edit survey" class="nav-item pull-xs-right pointer"><a href="' . $wcsa->basepath . 'editsurvey/' . $reqp[1] . '"><i class="fa fa-wrench" aria-hidden="true"></i></a></div>';
    }
    if( $reqlen == 2 && $reqp[0] == 'surveys' ) {
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '">Project ' . $reqp[1] . '</a></div>' . $subheadtext . '</div>';
        $headtext .= '<div title="Cemeteries list" onclick="WCSA.show_scope_contents(\'project\')" class="nav-item pull-xs-right pointer"><i class="fa fa-th-large" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Edit survey" class="nav-item pull-xs-right pointer"><a href="' . $wcsa->basepath . 'editsurvey/' . $reqp[1] . '"><i class="fa fa-wrench" aria-hidden="true"></i></a></div>';
        $headtext .= '<div title="See bookmark for this survey project" onclick="WCSA.show_bookmarks()" class="nav-item pull-xs-right pointer"><i class="fa fa-bookmark" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Export/download project data" class="nav-item pull-xs-right pointer"><a href="' . $wcsa->basepath . 'inc/export.php?survey=' . $reqp[1] . '"><i class="fa fa-download" aria-hidden="true"></i></a></div>';
    }
    if( $reqlen == 4 && $reqp[2] == 'cemeteries' ) {
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '"><i class="fa fa-chevron-left" aria-hidden="true"></i></a> ';
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '/cemeteries/' . $reqp[3] . '">Cemetery ' . $reqp[3] . '</a></div>' . $subheadtext . '</div>';
        $headtext .= '<div title="Sections list" onclick="WCSA.show_scope_contents(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-th-large" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Cemetery survey" onclick="WCSA.show_scope_survey(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-file-text-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Cemetery pictures" onclick="WCSA.show_scope_pictures(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-picture-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Toggle picture importing" onclick="WCSA.toggle_camera(\'cemetery\')" class="nav-item pull-xs-right pointer scope_survey"><i class="fa fa-camera" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Bookmark this cemetery" onclick="WCSA.bookmark(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-bookmark-o" aria-hidden="true"></i></div>';
    }
    if( $reqlen == 6 && $reqp[4] == 'sections' ) {
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '/cemeteries/' . $reqp[3] . '"><i class="fa fa-chevron-left" aria-hidden="true"></i></a> ';
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '/cemeteries/' . $reqp[3] . '/sections/' . $reqp[5] . '">Section ' . $reqp[5] . '</a></div>' . $subheadtext . '</div>';
        $headtext .= '<div title="Graves list" onclick="WCSA.show_scope_contents(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-th" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Section survey" onclick="WCSA.show_scope_survey(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-file-text-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Section pictures" onclick="WCSA.show_scope_pictures(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-picture-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Toggle picture importing" onclick="WCSA.toggle_camera(\'section\')" class="nav-item pull-xs-right pointer scope_survey"><i class="fa fa-camera" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Bookmark this section" onclick="WCSA.bookmark(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-bookmark-o" aria-hidden="true"></i></div>';
    }
    if( $reqlen == 8 && $reqp[6] == 'graves' ) {
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '/cemeteries/' . $reqp[3] . '/sections/' . $reqp[5] . '"><i class="fa fa-chevron-left" aria-hidden="true"></i></a> ';
        $headtext .= '<a href="' . $wcsa->basepath . 'surveys/' . $reqp[1] . '/cemeteries/' . $reqp[3] . '/sections/' . $reqp[5] . '/graves/' . $reqp[7] . '">Grave ' . $reqp[7] . '</a></div>' . $subheadtext . '</div>';
        $headtext .= '<div title="Grave survey" onclick="WCSA.show_scope_survey(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-file-text-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Grave pictures" onclick="WCSA.show_scope_pictures(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-picture-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Toggle picture importing" onclick="WCSA.toggle_camera(\'grave\')" class="nav-item pull-xs-right pointer scope_survey" style="display: block"><i class="fa fa-camera" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Bookmark this grave" onclick="WCSA.bookmark(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-bookmark-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Delete grave" onclick="WCSA.delete_scope(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-trash-o" aria-hidden="true"></i></div>';
    }

    print($headtext);
    
} else {
    print("Malformed request");
}

?>
                </div>
            </nav>
            <div id="error_header"><div id="error_header_content" class="container"></div></div>
            <div id="warn_header"><div id="warn_header_content" class="container"></div></div>
        </div>
    </header>
    <div id="main-content">
        <div class="container">
<?php

# Get the path parts
#$req = isset($_GET['request']) ? $_GET['request'] : '';
# Above code is already called earlier in index.php

$wcsa->page_request(explode('/', rtrim($req, '/')));

?>
        </div>
    </div>

    <!-- footer -->
    <div id="pictures_footer"><div class='x' onclick="WCSA.toggle_camera()"></div><div id="picture_carousel">No pictures found. To add photographs place them inside the 'photographs' folder.</div></div>

    <!-- modal -->
    <div id="main_modal" class="modal fade">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <h4 class="modal-title">Modal title</h4>
          </div>
          <div class="modal-body">
            <p>Modal body</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary">Save changes</button>
          </div>
        </div><!-- /.modal-content -->
      </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->


    <!-- jQuery first, then Tether, then Bootstrap JS. -->
    <script src="/WCS/js/jquery.min.js" integrity="sha384-THPy051/pYDQGanwU6poAc/hOdQxjnOEXzbT+OuUAFqNqFjL+4IGLBgCJC3ZOShY" crossorigin="anonymous"></script>
    <script src="/WCS/js/tether.min.js" integrity="sha384-Plbmg8JY28KFelvJVai01l8WyZzrYWG825m+cZ0eDDS1f7d/js6ikvy1+X+guPIB" crossorigin="anonymous"></script>
    <script src="/WCS/js/bootstrap.min.js" integrity="sha384-VjEeINv9OSwtWFLAtmc4JCtEJXXBub00gtSnszmspDLCtC0I4z4nqz7rEFbIZLLU" crossorigin="anonymous"></script>

    <!-- WCSA -->
    <script type="text/javascript" src="/WCS/js/wcsa.js"></script>
  </body>
</html>
