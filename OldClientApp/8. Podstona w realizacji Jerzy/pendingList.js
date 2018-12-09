/// <reference path="app.ts"/>
itemsModule.controller("PendingListController", function ($scope, $rootScope, $http, $location, $q, cultureService, pageService, dateHelper, cartService, toastrService) {
    var menu = angular.element(Utils.qs('#menu'));
    menu.scope().isDetails(false);
    $scope.closeCartPanel = function () {
        cartService.closePanel();
    };
    var closeRightPanels = function () {
        $scope.closeCartPanel();
        if (angular.element(qs(".wrapper")).hasClass("moved-right"))
            $rootScope.$broadcast('closePanel');
    };
    $scope.searchText = '';
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    $scope.dateFrom = dateHelper.removeMonths(today, 3);
    $scope.dateTo = today;
    $scope.dateOptions = {
        culture: cultureService.getKendoCulture()
    };
	
    var lazyLoad;
    $scope.clearFilters = function () {
        $scope.searchText = '';
		$scope.searchitems = ''; //BB Modyfikacja
        $scope.dateFrom = dateHelper.removeMonths(today, 3);
        $scope.dateTo = today;
        $scope.currentPage = 0;
        lazyLoad(false, true);
		
    };
	
	//BB Modyfikacja
	$scope.clearText = function () {
        $scope.searchitems = ''; 
       		
    };
	
	
    $scope.pageSize = 2000; //BB Modyfikacja
    $scope.currentPage = 0;
    $scope.showPager = false;
    $scope.backPage = false;
    $scope.nextPage = false;
    $scope.isBusy = false;
    $scope.data = [];
    $scope.showCode = true;
    var createQuery = function (skip, top, getFilter, updateFilter) {
        return "filter=" + encodeURIComponent($scope.searchText) + "&dateFrom=" + dateHelper.dateToString($scope.dateFrom) + "&dateTo=" + dateHelper.dateToString($scope.dateTo) + "&skip=" + skip + "&top=" + top + "\n                &getFilter=" + getFilter + "&updateFilter=" + updateFilter + "&controlDate=" + !$rootScope.isOnTheSamePage;
    };
    $scope.load = function (getFilter, updateFilter) {
        $scope.currentPage = 0;
        lazyLoad(getFilter, updateFilter);
    };
    lazyLoad = function (getFilter, updateFilter) {
        var q = createQuery($scope.pageSize * $scope.currentPage + 1, $scope.pageSize, getFilter, updateFilter);
        $scope.isBusy = true;
        $http.get("api/orders/?" + q)
            .then(function (result) {
            var items = result.data.items.set2[0];
            if (items)
                $scope.showCode = items.showCode;
            $scope.data = result.data.items.set1;
			
            $scope.noResults = result.data.items.set1.length === 0;
            var hasMore = result.data.hasMore;
            if ($scope.currentPage === 0)
                $scope.showPager = hasMore;
            if ($scope.showPager) {
                $scope.nextPage = hasMore;
                $scope.backPage = $scope.currentPage !== 0;
            }
            var filter = result.data.filter;
            if (filter) {
                $scope.searchText = filter.searchText;
                $scope.dateFrom = dateHelper.stringToDate(filter.dateFrom);
                $scope.dateTo = dateHelper.stringToDate(filter.dateTo);
            }
            $scope.isBusy = false;
        }, function () {
            $scope.isBusy = false;
            $scope.noResults = true;
            $scope.data = [];
        });
    };
    $scope.nextClicked = function () {
        $scope.currentPage++;
        lazyLoad(false, false);
    };
    $scope.backClicked = function () {
        $scope.currentPage--;
        lazyLoad(false, false);
    };
    $scope.search = function (searchText) {
        closeRightPanels();
        var doSearch = false;
        if (searchText.length > 2) {
            var transformText = _.str.words(searchText);
            for (var i = 0, l = transformText.length; i < l; i++) {
                transformText[i] = _.str.trim(transformText[i], "-_.&`@':/\\");
                if (transformText[i].length > 2) {
                    doSearch = true;
                    $scope.load(false, true);
                    break;
                }
            }
            if (!doSearch)
                toastrService.info($rootScope.resources.phraseTooShort, "", { timeOut: 1500 });
        }
        else {
            if (searchText.length == 0)
                $scope.load(false, true);
            else
                toastrService.info($rootScope.resources.phraseTooShort, "", { timeOut: 1500 });
        }
    };
    $scope.load(true, false);
	
});


//BB Modyfikacja    
itemsModule.filter("groupBy",["$parse","$filter",function($parse,$filter){
  return function(array,groupByField){
    var result	= [];
           var prev_item = null;
            var groupKey = false;
            var filteredData = $filter('orderBy')(array,groupByField);
            for(var i=0;i<filteredData.length;i++){
              groupKey = false;
              if(prev_item !== null){
                if(prev_item[groupByField] !== filteredData[i][groupByField]){
                  groupKey = true;
                }
              } else {
                groupKey = true;  
              }
              if(groupKey){
                filteredData[i]['group_by_key'] =true;  
              } else {
                filteredData[i]['group_by_key'] =false;  
              }
              result.push(filteredData[i]);
              prev_item = filteredData[i];
            }
            return result;
 }
}])

