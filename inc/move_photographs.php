<?php
# move_photographs.php
# Moves pictures from unsorted to scope (or other direction)

date_default_timezone_set('UTC');

$data = $_POST;

require('wcsa.php');

$wcsa->move_photograph($data);

?>
