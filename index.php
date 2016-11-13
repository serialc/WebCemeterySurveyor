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
    <link rel="stylesheet" href="/~cyrille/WCS/css/bootstrap.min.css" integrity="sha384-2hfp1SzUoho7/TsGGGDaFdsuuDL0LX2hnUp6VkX3CUQ2K4K+xjboZdsXyp4oUHZj" crossorigin="anonymous">
    <link rel="stylesheet" href="/~cyrille/WCS/css/wcs.css">
    <link rel="stylesheet" href="/~cyrille/WCS/font-awesome-4.6.3/css/font-awesome.min.css">

    <title>WCS</title>

    <!-- Favicons -->
    <link rel="icon" href="/~cyrille/WCS/favicon.ico">

  </head>
  <body>
    <header class="navbar navbar-full navbar-light navbar-static-top">
        <div class="container correction">
            <nav class="navbar correction">
                <div class="nav navbar-nav">
<?php
# Provide appropriate header

require('inc/wcsa.php');

$req = $_GET[request];

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
    $headtext = 
        '<div class="nav-item"><a href="' . $buildup_path . '"><i class="fa fa-home" aria-hidden="true"></i></a></div>' .
        '<div class="nav-item">';

    for( $i = 1; $i < $reqlen; $i += 2) {
        # Add url path to each section
        $buildup_path .= $reqp[$i - 1] . '/' . $reqp[$i] . '/';
        $headtext .= '<a href="' . $buildup_path . '">' . $reqp[$i] . '</a>' . $path_sep;
    }

    # trim off the trainling separator ('/' or ':' or whtatever is being used as $path_sep)
    $headtext = rtrim($headtext, $path_sep);

    # close the path nav-item
    $headtext .= '</div>';

    # show other headings based on page/path
    if( $reqlen == 4 && $reqp[2] == 'cemetery' ) {
        $headtext .= '<div title="Sections list" onclick="WCSA.show_scope_contents(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-th-large" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Cemetery survey" onclick="WCSA.show_scope_survey(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-file-text-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Cemetery pictures" onclick="WCSA.show_scope_pictures(\'cemetery\')" class="nav-item pull-xs-right pointer"><i class="fa fa-picture-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Toggle picture importing" onclick="WCSA.toggle_camera(\'cemetery\')" class="nav-item pull-xs-right pointer scope_survey"><i class="fa fa-camera" aria-hidden="true"></i></div>';
    }
    if( $reqlen == 6 && $reqp[4] == 'section' ) {
        $headtext .= '<div title="Graves list" onclick="WCSA.show_scope_contents(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-th" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Section survey" onclick="WCSA.show_scope_survey(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-file-text-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Section pictures" onclick="WCSA.show_scope_pictures(\'section\')" class="nav-item pull-xs-right pointer"><i class="fa fa-picture-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Toggle picture importing" onclick="WCSA.toggle_camera(\'cemetery\')" class="nav-item pull-xs-right pointer scope_survey"><i class="fa fa-camera" aria-hidden="true"></i></div>';
    }
    if( $reqlen == 8 && $reqp[6] == 'grave' ) {
        $headtext .= '<div title="Grave survey" onclick="WCSA.show_scope_survey(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-file-text-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Grave pictures" onclick="WCSA.show_scope_pictures(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-picture-o" aria-hidden="true"></i></div>';
        $headtext .= '<div title="Toggle picture importing" onclick="WCSA.toggle_camera(\'grave\')" class="nav-item pull-xs-right pointer"><i class="fa fa-camera" aria-hidden="true"></i></div>';
    }

    print($headtext);
    
} else {
    print("Malformed request");
}

?>
                </div>
            </nav>
        </div>
    </header>
    <div id="main-content">
        <div class="container">
<?php

# Get the path parts
$req = $_GET[request];
$arr = get_defined_vars();
#print(nl2br(print_r($req, true)));

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
    <script src="/~cyrille/WCS/js/jquery.min.js" integrity="sha384-THPy051/pYDQGanwU6poAc/hOdQxjnOEXzbT+OuUAFqNqFjL+4IGLBgCJC3ZOShY" crossorigin="anonymous"></script>
    <script src="/~cyrille/WCS/js/tether.min.js" integrity="sha384-Plbmg8JY28KFelvJVai01l8WyZzrYWG825m+cZ0eDDS1f7d/js6ikvy1+X+guPIB" crossorigin="anonymous"></script>
    <script src="/~cyrille/WCS/js/bootstrap.min.js" integrity="sha384-VjEeINv9OSwtWFLAtmc4JCtEJXXBub00gtSnszmspDLCtC0I4z4nqz7rEFbIZLLU" crossorigin="anonymous"></script>

    <!-- WCSA -->
    <script type="text/javascript" src="/~cyrille/WCS/js/wcsa.js"></script>
  </body>
</html>
