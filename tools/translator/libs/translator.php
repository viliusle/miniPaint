<?php

require_once(__DIR__ . '/../config.php');
require_once(__DIR__ . '/GoogleTranslate.php');

use \Statickidz\GoogleTranslate;

/**
 * translator scans javascript, html files, extracts strings and generate translation with json format.
 */
class Translator {

	public $files;
	public $strings;
	public $translations;
	public $lang;

	/**
	 * scan external resources
	 */
	public function scan() {
		global $SOURCE_DIRS;
		if (count($SOURCE_DIRS) == 0)
			throw new Exception('empty settings: $SOURCE_DIRS');

		foreach ($SOURCE_DIRS as $dir) {
			if (strpos($dir, '\\') !== false) {
				//windows url
				$dir = str_replace('/', '\\', $dir);
			}
			$dir = realpath($dir);

			if (is_dir($dir)) {
				//directory
				$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
				foreach ($rii as $file) {
					if ($file->isDir()) {
						continue;
					}
					$this->files[] = $file->getPathname();
				}
			}
			else if (is_file($dir)) {
				$this->files[] = $dir;
			}
			else {
				throw new Exception('can not import object: ' . $dir);
			}
		}
	}

	/**
	 * extracts strings from files
	 */
	public function extract() {
		$this->strings = array();
		foreach ($this->files as $file) {
			$content = file_get_contents($file);
			if ($content == '')
				throw new Exception('can not get file content: ' . $content);

			$strings = array();
			if (stripos($file, '.js') !== false) {
				//json

				$ignore_matches = [
					'\.addEventListener',
					'\.style\.',
				];
				foreach ($ignore_matches as $ignore_match) {
					$content = preg_replace('/' . $ignore_match . '.*/', '', $content);
				}

				$content = preg_replace('|[\r\n][ \t]*//.*|', "\n", $content);

				//extract between ' '
				$out = array();
				preg_match_all("/[']([^']*)[']/", $content, $out);
				$strings = array_merge($strings, $out[1]);

				//extract between " "
				$out = array();
				preg_match_all('/["]([^"]*)["]/', $content, $out);
				$strings = array_merge($strings, $out[1]);
			}
			if (stripos($file, '.htm') !== false || true) {
				//html
				$ignore_tags = [
					'dir',
					'lang',
					'http-equiv',
					'content',
					'name',
					'rel',
					'style',
					'onclick',
					'type',
					'class',
					'id',
					'href',
					'onchange',
					'onKeyUp',
					'oninput',
					'src',
				];
				foreach ($ignore_tags as $ignore_tag) {
					$content = preg_replace('/' . $ignore_tag . '="[^"]*"/', '', $content);
				}

				//extract between " "
				$out = array();
				preg_match_all('/["]([^"]*)["]/', $content, $out);
				//$strings = array_merge($strings, $out[1]);
				//extract between > <
				$out = array();
				preg_match_all('|>([^<]{1,200})<[^ ]|', $content, $out);
				$strings = array_merge($strings, $out[1]);
			}

			foreach ($strings as $string) {
				if (trim($string) == '' || substr($string, 0, 2) == './')
					continue;

				//remove tags
				$string = preg_replace('/<[^>]*>/', ' ', $string);
				$string = trim($string);

				$this->strings[] = $string;
			}
		}

		$this->strings = array_unique($this->strings);
		sort($this->strings);
	}

	/**
	 * filters out some strings
	 */
	public function filter() {
		$copy = $this->strings;
		$this->strings = array();
		foreach ($copy as $string) {
			$string = trim($string);
			if (is_numeric($string)) {
				//number
				continue;
			}
			if (strlen($string) < 2) {
				//too short
				continue;
			}
			if (preg_replace("/[^A-Z0-9]+/", "", $string[0]) == '') {
				//first letter must be common uppercase letter or number
				continue;
			}
			if (strpos($string, '(') !== false && strpos($string, ')') !== false && strpos($string, '.') !== false) {
				//function, not string
				continue;
			}
			if (strpos($string, "\n") !== false || strpos($string, "\r") !== false) {
				//multi-line
				continue;
			}
			if (preg_replace("/[^a-z]+/", "", $string) == '') {
				//all caps - not translatable
				continue;
			}
			if (strlen($string) > 30 && strpos($string, " ") === false) {
				//long word without spaces
				continue;
			}

			//$string = $this->my_mb_ucfirst(mb_strtolower($string));

			$this->strings[] = $string;
		}
		$this->strings = array_unique($this->strings);
		$this->strings = array_values($this->strings);
	}

	/**
	 * prepare strings for translating for user
	 */
	public function prepare() {
		$this->scan();
		$this->extract();
		$this->filter();

		$data = $this->strings;

		$in_content = '';
		if (isset($_POST['in']))
			$in_content = $_POST['in'];

		$lang = '';
		if (isset($_POST['lang']))
			$lang = $_POST['lang'];

		echo '<textarea name="out" style="width:100%;height:25vh;">' . implode("\n", $data) . '</textarea><br /><br />';
		echo 'Transalte text above with <a href="https://translate.google.com/">translator</a> and paste result below:<br /><br />';
		echo '<textarea name="in" style="width:100%;height:25vh;">' . $in_content . '</textarea><br />';
		echo '<input type="submit" name="action" value="Translate manually" />';
	}

	/**
	 * combines source strings and manually translated strings to json format
	 * 
	 * @param array $translation
	 * @param string $lang 2 lang cde
	 */
	public function add_translation($translation) {
		$translation = trim($translation);
		if ($translation != '')
			$translation = explode("\n", $translation);
		else
			$translation = array();

		if (count($this->strings) == 0)
			throw new Exception('0 translations found in files.');
		if (count($this->strings) != count($translation))
			throw new Exception(count($this->strings) . ' translations imported from file, but you provided ' . count($translation) . ', it must match');

		$this->translations = new stdClass();
		foreach ($this->strings as $key => $value) {
			$translated = trim($translation[$key]);

			$this->translations->$value = $translated;
		}
	}

	public function auto_translate() {
		global $LANGUAGES, $LANG_DIR;

		$service = new GoogleTranslate();
		$text = implode("\n", $this->strings);

		foreach ($LANGUAGES as $lang) {
			echo "<br />$lang: ";

			$file_path = $LANG_DIR . strtolower($lang) . ".json";

			//read old translations
			$old = array();
			if (file_exists($file_path)) {
				$old = file_get_contents($file_path);
				if ($old === false)
					throw new Exception('can not open file: ' . $file_path);
				$old = json_decode($old);
				if ($old === null)
					throw new Exception($file_path . ' data is not json');
			}

			$translation = $service->translate('en', $lang, $text);
			if ($translation == '') {
				throw new Exception('empty response from transation service');
			}
			$translation = str_replace("\r", '', $translation);
			$translation = explode("\n", $translation);
			if (count($this->strings) != count($translation)) {
				throw new Exception(count($this->strings) . ' translations imported from file, but service gave: ' . count($translation) . ', it must match');
			}

			//generate array
			$this->translations = new stdClass();
			foreach ($this->strings as $key => $value) {
				$translated = trim($translation[$key]);

				$this->translations->$value = $translated;
			}

			//merge
			$merged = (object) array_merge((array) $this->translations, (array) $old);
			
			//remove not use elements
			foreach ($merged as $k => $v) {
				if (isset($this->translations->$k) == false) {
					$v = null;
					unset($merged->$k);
				}
			}
			$this->translations = $merged;

			//generate JSON
			$html = json_encode($this->translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

			//save
			$written = file_put_contents($file_path, $html);
			if ($written == 0) {
				throw new Exception('can not write to: ' . $file_path);
			}
			else {
				echo 'OK';
			}

			//sleep 05-1s
			usleep(rand(500, 1000) * 1000);
		}

		$this->save_empty();
	}

	/**
	 * saves current data as empty file
	 */
	public function save_empty() {
		global $LANG_DIR_EMPTY;

		if ($LANG_DIR_EMPTY == '')
			return;
		
		$data = new stdClass();
		foreach($this->strings as $value){
			$data->$value = '';
		}
		
		$html = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

		$written = file_put_contents($LANG_DIR_EMPTY, $html);
		if ($written == 0) {
			throw new Exception('can not write to: ' . $LANG_DIR_EMPTY);
		}
		else {
			echo '<p><b>File updated: <b>' . $LANG_DIR_EMPTY . '</b></p>';
		}
	}

	/**
	 * show formated translation, use json. parameters are only for testing mode
	 */
	public function show_merged() {
		echo '<textarea style="width:100%;height:30vh;margin-top:10px;">';
		echo json_encode($this->translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
		echo '</textarea>';
	}

	/**
	 * merge two translations
	 */
	public function merge() {
		echo 'Old translations: <b>(priority on same keys)</b><br />';
		$value = '';
		if (isset($_POST['merge_old']))
			$value = $_POST['merge_old'];
		echo '<textarea style="width:100%;height:20vh;" name="merge_old">' . $value . '</textarea>';

		echo '<br /><br />';

		echo 'New translations:<br />';
		$value = '';
		if (isset($_POST['merge_new']))
			$value = $_POST['merge_new'];
		echo '<textarea style="width:100%;height:20vh;" name="merge_new">' . $value . '</textarea>';
		echo '<input type="submit" name="action" value="Merge" /><br /><br />';

		if (isset($_POST['merge_old']) == false)
			return;

		$old = json_decode($_POST['merge_old']);
		$new = json_decode($_POST['merge_new']);

		if ($old === null)
			throw new Exception('Old data is not json');
		if ($new === null)
			throw new Exception('New data is not json');

		//merge
		$merged = (object) array_merge((array) $new, (array) $old);

		//remove not use elements
		foreach ($merged as $k => $v) {
			if (isset($new->$k) == false) {
				$v = null;
				unset($merged->$k);
			}
		}

		echo '<textarea style="width:100%;height:30vh;">';
		echo json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
		echo '</textarea>';
	}

	private function my_mb_ucfirst($str) {
		$fc = mb_strtoupper(mb_substr($str, 0, 1));
		return $fc . mb_substr($str, 1);
	}

}
