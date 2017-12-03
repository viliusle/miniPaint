<?php
require_once(__DIR__ . '/libs/translator.php');
$translator = new Translator();
?>

<!DOCTYPE html>
<html lang="en-US">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<title>Translator</title>
</head>
<body>
	<h3 style="margin: 10px 0px;"><a href="">Translator</a></h3>
	<form action="" method="post">
		<input type="submit" name="action" value="Import" />
		<input type="submit" name="action" value="Filter" />
		<input type="submit" name="action" value="Translate manually" />
		<input type="submit" name="action" value="Merge" />
		<input style="font-weight:bold;" type="submit" name="action" value="Auto Tanslate" />
		<br /><br />
		<?php
		if (count($_POST) > 0) {
			try {
				if ($_POST['action'] == 'Import') {
					$translator->scan();
					$translator->extract();
					echo "<xmp>"; print_r($translator->strings); echo "</xmp>\n";
				}
				if ($_POST['action'] == 'Filter') {
					$translator->scan();
					$translator->extract();
					$translator->filter();
					echo "<xmp>"; print_r($translator->strings); echo "</xmp>\n";
				}
				if ($_POST['action'] == 'Translate manually') {
					//show form
					$translator->prepare();

					//translate
					if (isset($_POST['in'])) {
						$translation = $_POST['in'];

						$translator->scan();
						$translator->extract();
						$translator->filter();
						$translator->add_translation($translation);
						$translator->show_merged();
					}
				}
				if ($_POST['action'] == 'Merge') {
					$translator->merge();
				}
				if ($_POST['action'] == 'Auto Tanslate') {
					//prepare
					$translator->scan();
					$translator->extract();
					$translator->filter();

					$translator->auto_translate();
				}
			}
			catch (Exception $exc) {
				echo '<div style="margin-top:10px;color:red;">ERROR: ' . $exc->getMessage() . '</div>';
			}
		}
		?>
	</form>
</body>
</html>
