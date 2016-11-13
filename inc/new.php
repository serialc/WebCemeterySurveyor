<?php
date_default_timezone_set('UTC');

$new_item = $_POST;

require('wcsa.php');

# check that all have values
foreach($new_item as $name => $value) {
    if( $value == '' ) {
        $wcsa->send_error('VALUE ERROR: ' . $name . ' has no value');
    }
}

switch($new_item['type']) {
case 'new_survey':
    $wcsa->create_new_survey($new_item['new_survey_name']);
    break;

case 'new_scope_item':
    $wcsa->create_new_scope_item($new_item);
    break;

default:
    $wcsa->send_error('OPERATION ERROR: ' . $new_item['type']. ' is unknown.');
}


?>
