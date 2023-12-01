<?php
global $LANGUAGES;

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
	<h3 style="margin: 10px 0;"><a href="">Translator</a></h3>
	<form action="" method="post">
		<b>Helpers</b>:
		<input type="submit" name="action" value="Import" />
		<input type="submit" name="action" value="Filter" />
		<input type="submit" name="action" value="Translate manually" />
		<input type="submit" name="action" value="Merge" />
		<br /><br />
		<b>Actions</b>:
		<input type="submit" name="action" value="Generate empty.json" />
		<input type="submit" name="action" value="Auto Translate: all" /> or

		<?php
		foreach ($LANGUAGES as $lang) {
			echo '<button type="submit" name="action" value="Auto Translate: '.strtolower($lang).'">'.strtoupper($lang).'</button> ';
		}
		?>
		<br /><br />
		<?php
		if (count($_POST) > 0) {
			try {
				if ($_POST['action'] == 'Import') {
					$translator->scan();
					$translator->extract();
					echo "<pre>"; print_r($translator->strings); echo "</pre>\n";
				}
				if ($_POST['action'] == 'Filter') {
					$translator->scan();
					$translator->extract();
					$translator->filter();
					echo "<pre>"; print_r($translator->strings); echo "</pre>\n";
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
				if (stripos($_POST['action'], 'Auto Translate') !== false) {
					//prepare
					$translator->scan();
					$translator->extract();
					$translator->filter();

					$translator->auto_translate($_POST['action']);
				}
				if ($_POST['action'] == 'Generate empty.json') {
					//prepare
					$translator->scan();
					$translator->extract();
					$translator->filter();

					$translator->save_empty();
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
