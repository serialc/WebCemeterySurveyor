<?php
# update_scope_cat.php
# Any survey completion/interaction is sent through her to be saved/edited

date_default_timezone_set('UTC');

$data = $_POST;

require('wcsa.php');

if( $wcsa->submit_data($data) ) {
    print '{}';
}

?>
