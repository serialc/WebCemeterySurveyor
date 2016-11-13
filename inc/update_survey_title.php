<?php
# update_survey_title.php
# Update survey title name for tab, group

date_default_timezone_set('UTC');

$update = $_POST;

require('wcsa.php');

$wcsa->update_survey_title($update);

?>
