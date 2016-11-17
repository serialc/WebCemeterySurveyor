<?php
# export.php
# Export the data for this project

date_default_timezone_set('UTC');

if( isset($_GET['survey']) ) {
    $project =  $_GET['survey'];

    require('wcsa.php');

    $wcsa->export($project);
}

?>
