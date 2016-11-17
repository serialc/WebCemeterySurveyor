<?php
# update_json.php
# Receives the new survey json structure and replaces previous

date_default_timezone_set('UTC');

$new_data = $_POST;

require('wcsa.php');

if($wcsa->update_json($new_data)) {
    print '{}';
}

?>
