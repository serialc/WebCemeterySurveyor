<?php
# bookmark.php
# Send info to function to store bookmark for this project/survey

date_default_timezone_set('UTC');

$passed = $_POST;

require('wcsa.php');

switch($passed['op']) {
case 'new':
    if($wcsa->add_bookmark($passed['data'])) {
        print '{}';
    }
    break;

case 'delete':
    if($wcsa->delete_bookmark($passed['data'])) {
        print '{}';
    }
    break;
}

?>
