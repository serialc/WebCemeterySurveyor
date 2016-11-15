<?php
# associate_photo.php
# Send info to function to move picture to proper folder

date_default_timezone_set('UTC');

$data = $_POST;

require('wcsa.php');

if($wcsa->associate_photo($data)) {
    print '{}';
}

?>
