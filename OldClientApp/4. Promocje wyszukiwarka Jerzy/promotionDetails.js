/// <reference path="app.ts"/>
itemsModule.controller("PromotionDetailsController", function ($scope, $rootScope, $location, $http, $routeParams, $window, $dialog, cartService, dateHelper, permissionHelper, $filter, $timeout, toastrService, cultureService) {
    var id = $routeParams.id;
    if (typeof id === "undefined")
        return;
    $scope.header = [];
    $scope.items = [];
    $scope.deliveryMethods = [];
    $scope.showFields = true;
    $scope.showAddToCart = true;
    $scope.groupId = 0;
    $scope.searchText = '';
    $scope.isNameFiltered = true;
    $scope.isCodeFiltered = false;
    $scope.isProducerFiltered = false;
    $scope.isDescriptionFiltered = false;
    $scope.isBrandFiltered = false;
    $scope.brandId = 0;
    $scope.warehouseId = 0;
    $scope.onlyAvailable = false;
    $scope.filterInGroup = false;
    $scope.pageSize = 22;
    $scope.currentPage = 0;
    $scope.showPager = false;
    $scope.backPage = false;
    $scope.nextPage = false;
	
	$scope.searchText = '';
		  
    var lazyLoad;
    $scope.clearFilters = function () {
        $scope.searchText = '';
        $scope.currentPage = 0;
        lazyLoad(false, true);
    };
		
    var createQuery = function (skip, top, getFilter, updateFilter) {
        return "groupId=" + $scope.groupId + "&filter=" + encodeURIComponent($scope.searchText) + "&isNameFiltered=" + $scope.isNameFiltered + "&isCodeFiltered=" + $scope.isCodeFiltered + "&isProducerFiltered=" + $scope.isProducerFiltered + "&isDescriptionFiltered=" + $scope.isDescriptionFiltered + "\n                &isBrandFiltered=" + $scope.isBrandFiltered + "&brandId=" + $scope.brandId + "&warehouseId=" + $scope.warehouseId + "&onlyAvailable=" + $scope.onlyAvailable + "&filterInGroup=" + $scope.filterInGroup + "\n                &features=&attributes=&skip=" + skip + "&top=" + top + "&getFilter=" + getFilter + "&updateFilter=" + updateFilter;
    };
    var lazyLoad;
    $scope.load = function (getFilter, updateFilter) {
        $scope.currentPage = 0;
        lazyLoad(getFilter, updateFilter);
		
		
    };
    var calculateValues;
    lazyLoad = function (getFilter, updateFilter) {
        var q = createQuery($scope.pageSize * $scope.currentPage + 1, $scope.pageSize, getFilter, updateFilter);
        $scope.isBusy = true;
        $http.get("api/promotions/" + id + "?" + q)
            .then(function (results) {
            if (results.data.items.set4.length > 0) {
                $scope.header = results.data.items.set4[0];
                $scope.cartNumbers = cartService.getCartNumbers($scope.header.cartCount);
                if ($scope.header.effectiveFrom === '')
                    $scope.header.effectiveFrom = '---';
                if ($scope.header.until === '')
                    $scope.header.until = '---';
                if ($scope.header.applicationId === 1)
                    $scope.showFields = false;
            }
            calculateValues(results.data.items.set5);
            $scope.items = results.data.items.set5;
            var hasMore = results.data.hasMore;
            if ($scope.currentPage === 0)
                $scope.showPager = hasMore;
            if ($scope.showPager) {
                $scope.nextPage = hasMore;
                $scope.backPage = $scope.currentPage !== 0;
            }
            $scope.noResults = results.data.items.set5.length === 0;
            $scope.deliveryMethods = results.data.items.set6;
			
			
					
			
            $scope.isBusy = false;
        }, function () {
            $scope.isBusy = false;
        });
    };
    calculateValues = function (items) {
        for (var i = 0, l = items.length; i < l; i++) {
            switch (items[i].type) {
                case 1:
                    items[i].value = items[i].value + ' %';
                    items[i].type = $rootScope.resources.percentage;
                    break;
                case 2:
                    items[i].value = _.str.sprintf("%s %s", items[i].value, items[i].currency);
                    items[i].type = $rootScope.resources.discountValue;
                    break;
                case 3:
                    items[i].value = _.str.sprintf("%s %s", items[i].value, items[i].currency);
                    items[i].type = $rootScope.resources.fixedPrice;
                    break;
            }
            items[i].quantity = 0;
            items[i].cartNo = 1;
            var quantityPrecision;
            if (items[i].unitPrecision != undefined)
                quantityPrecision = items[i].unitPrecision;
            else
                quantityPrecision = items[i].isUnitTotal ? 0 : 4;
            items[i].quantityOptions = {
                culture: cultureService.getKendoCulture(),
                decimals: quantityPrecision,
                format: "n" + quantityPrecision,
                min: 0,
                max: 9999999.9999
            };
        }
        ;
    };
    $scope.addToCart = function (item) {
        if (item.quantity == null) {
            item.quantity = 0;
            return;
        }
        else if (item.quantity === 0)
            return;
        if ($scope.header.applicationId === 1)
            cartService.add(item.cartNo, item.id, item.quantity, null, null, null, item.basicUnitId, true);
        else
            cartService.add(item.cartNo, item.id, item.quantity, null, null, null, item.basicUnit, true);
        toastrService.info(_.str.sprintf($rootScope.resources.articleAddedToCart, item.name, item.cartNo), "", { timeOut: 1500 });
        item.quantity = 0;
        item.cartNo = 1;
    };
    $scope.goBack = function () {
        $window.history.back();
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
