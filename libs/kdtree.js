/*
author:	Vladimir Seregin (Peko)

usage:	var KDTREE = new datastructure.KDTree([{x: 22, y:55},...]);
	var nearest = KDTREE.getNearestNeighbours({x: x, y: y}, NUM_NEAREST);
*/

var datastructure = (function() {
	var AXIS_X  = 0;
	var AXIS_Y = 1;
	var K = 2; // I only require a 2d k-d tree
	function KDTreeNode(point) {
		this.point = point;
		this.leftChild = null;
		this.rightChild = null;
	}
	function KDTree(points) {
		var boundingRect = {
			maxX: -Math.pow(2, 31), 
			minX:  Math.pow(2, 31) - 1, 
			maxY: -Math.pow(2, 31), 
			minY:  Math.pow(2, 31) - 1
		};
		for (var i = 0; i < points.length; ++i) {
			boundingRect.minX = Math.min(boundingRect.minX, points[i].x);
			boundingRect.minY = Math.min(boundingRect.minY, points[i].y);
			boundingRect.maxX = Math.max(boundingRect.maxX, points[i].x);
			boundingRect.maxY = Math.max(boundingRect.maxY, points[i].y);
		}
		this.rootNode = createKDTree_(points, 0, boundingRect);
	};
	function createKDTree_(points, depth, boundingRect) {
		if (points.length == 0) {
			return null;
		}
		var axis = depth % K; 
		points.sort(function (a, b) {
			if (axis == AXIS_X) {
				return a.x - b.x;
			} else {
				return a.y - b.y;
			}
		});
		var medianIndex = Math.floor(points.length / 2);
		var node = new KDTreeNode(points[medianIndex]);
		node.boundingRect = boundingRect;
		var leftChildBoundingRect = {
			minX: boundingRect.minX, 
			maxX: axis == AXIS_X ? node.point.x : boundingRect.maxX, 
			minY: boundingRect.minY, 
			maxY: axis == AXIS_Y ? node.point.y : boundingRect.maxY
		};
		var rightChildBoundingRect = {
			minX: axis == AXIS_X ? node.point.x : boundingRect.minX, 
			maxX: boundingRect.maxX, 
			minY: axis == AXIS_Y ? node.point.y : boundingRect.minY, 
			maxY: boundingRect.maxY
		};
		node.leftChild  = createKDTree_(points.slice(0, medianIndex), depth + 1, leftChildBoundingRect); 
		node.rightChild = createKDTree_(points.slice(medianIndex + 1), depth + 1, rightChildBoundingRect);
		return node;
	}
	KDTree.prototype.getNearestNeighbour = function(searchCoord, opt_consideredPoints) {
		var results = [];
		this.getNearestNeighbours_(this.rootNode, searchCoord, 0, results, 1, opt_consideredPoints);
		return results.length == 0 ? null : results[0].node.point;
	};
	KDTree.prototype.getNearestNeighbours = function(searchCoord, maxResults, opt_consideredPoints) {
		var results = [];
		this.getNearestNeighbours_(this.rootNode, searchCoord, 0, results, maxResults, opt_consideredPoints);
		var points = [];
		for (var i = 0; i < results.length; ++i) {
			points.push(results[i].node.point);
		}
		return points;
	};
	KDTree.prototype.getNearestNeighbours_ = function(currNode, searchCoord, depth, results, maxResults, opt_consideredPoints) {
		if (opt_consideredPoints) {
			opt_consideredPoints.push(currNode.point);
		}
		var axis = depth % K;
		var currNodeDistanceToDesiredCoord = getSquaredEuclidianDistance(searchCoord.x, searchCoord.y, currNode.point.x, currNode.point.y);
		var bestSeen = {node:currNode, distance: currNodeDistanceToDesiredCoord};
		insertResult_(results, bestSeen, maxResults);
		var searchNodeSplittingCoord = axis == AXIS_X ? searchCoord.x 	 : searchCoord.y;
		var currNodeSplittingCoord   = axis == AXIS_X ? currNode.point.x : currNode.point.y;
		var searchLeft    = searchNodeSplittingCoord < currNodeSplittingCoord;
		var targetChild   = searchLeft ? currNode.leftChild  : currNode.rightChild;
		var oppositeChild = searchLeft ? currNode.rightChild : currNode.leftChild;
		if (targetChild) {
			this.getNearestNeighbours_(targetChild, searchCoord, depth + 1, results, maxResults, opt_consideredPoints);
		}
		if (oppositeChild) {
			var toX, toY;
			if (axis == AXIS_X) {
				toX = currNode.point.x;
				toY = searchCoord.y;
				if (searchCoord.y < oppositeChild.boundingRect.minY) {
					toY = oppositeChild.boundingRect.minY;
				} else if (searchCoord.y > oppositeChild.boundingRect.maxY) {
					toY = oppositeChild.boundingRect.maxY;
				}
			} else {
				toY = currNode.point.y;
				toX = searchCoord.x;
				if (searchCoord.x < oppositeChild.boundingRect.minX) {
					toX = oppositeChild.boundingRect.minX;
				} else if (searchCoord.x > oppositeChild.boundingRect.maxX) {
					toX = oppositeChild.boundingRect.maxX;
				}
			}
			var squaredDist = getSquaredEuclidianDistance(searchCoord.x, searchCoord.y, toX, toY);
			if (squaredDist <= results[results.length - 1].distance) {
				this.getNearestNeighbours_(oppositeChild, searchCoord, depth + 1, results, maxResults, opt_consideredPoints);
			}
		}
	};
	function insertResult_(results, insertNode, maxResults) {
		var insertIndex;
		for (insertIndex = results.length - 1; insertIndex >= 0; --insertIndex) {
			var nearestNeighbourNode = results[insertIndex];
			if (insertNode.distance > nearestNeighbourNode.distance) {
				break;
			}
		}
		results.splice(insertIndex + 1, 0, insertNode);
		if (results.length > maxResults) {
			results.pop();
		}
	}
	function getSquaredEuclidianDistance(x1, y1, x2, y2) {
		var dx = x1 - x2;
		var dy = y1 - y2;
		return dx * dx + dy * dy;
	}
	var module = {};
	module.KDTree = KDTree;  // KDTree constructor.
	return module;
})();
