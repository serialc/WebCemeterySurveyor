<?php
date_default_timezone_set('UTC');

$data = $_POST;

require('wcsa.php');

$wcsa->update_scope_name($data);

?>
