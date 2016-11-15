<?php
# get_scope_pic_list.php
# Receives the specifier to retrive the scope item pictures info
# Returns the list

date_default_timezone_set('UTC');

$id = $_POST;

require('wcsa.php');

print $wcsa->get_scope_photographs($id);

?>
