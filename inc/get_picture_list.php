<?php
# get_picture_list.php
# Receives the specifier to retrive the file names of pictures for the item
# Returns the list

date_default_timezone_set('UTC');

$id = $_POST;

require('wcsa.php');

print $wcsa->get_unsorted_photographs($id);

?>
