<?php
# associate_photo.php
# Send info to function to move picture to proper folder

date_default_timezone_set('UTC');

$data = $_POST;

require('wcsa.php');

if($data['action'] === "associate") {
    $wcsa->associate_photo($data);
}
if($data['action'] === "unlink") {
    $wcsa->disassociate_photo($data);
}

?>
