<?php
date_default_timezone_set('UTC');

$data = $_POST;

require('wcsa.php');

if($wcsa->delete_scope($data)) {
    print '{}';
}

?>
