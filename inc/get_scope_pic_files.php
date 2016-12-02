<?php
# get_scope_pic_files.php
# Receives the specifier to retrive the scope item pictures (file names)
# Returns the list

date_default_timezone_set('UTC');

$id = $_POST;

require('wcsa.php');

print json_encode($wcsa->get_scope_photograph_folder_files($id), JSON_PRETTY_PRINT);

?>
