/// <reference path="app.ts"/>
itemsModule.controller("CartController", function ($scope, $rootScope, $http, $routeParams, $location, $window, cartService, $q, $timeout, cultureService, permissionHelper, toastrService, $dialog, dateHelper, $filter) {
    var id = $routeParams.id;
    if (typeof id === "undefined")
        return;
    var menu = angular.element(Utils.qs('#menu'));
    menu.scope().isDetails(true);
    $scope.showHeader = true;
    $scope.showLeftbar = false;
    $scope.closeLeftBar = function () {
        $scope.showHeader = false;
        $scope.showLeftbar = true;
    };
    $scope.$on('closePanel', function () {
        $scope.showHeader = false;
        $scope.showLeftbar = true;
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest')
            $scope.$apply();
    });
    $scope.showLeftBar = function () {
        $scope.showHeader = true;
        $scope.showLeftbar = false;
        cartService.closePanel();
    };
    $scope.addItemsToCart = function () {
        $rootScope.cartId = Number(id);
        $location.path("/Items/");
    };
    //konfiguracja
    $scope.configuration = {
        getDeliveryCost: false,
        deliveryMethodChange: false,
        receiptDateChange: false,
        showDeliveryMethod: false,
        showCompletion: false,
        showDiscount: false,
        paymentFormChange: false,
        paymentDateChange: false,
        warehouseChange: false,
        showImages: false,
        showCode: false,
        showPrice: false,
        showState: false,
        showHeader: true,
        stateMode: false,
        stateAvailableColor: 'Black',
        stateNoneColor: 'Black',
        showFeatures: true,
        createInquiries: false,
        applicationId: 0
    };
    $scope.isExpanded = false;
    $scope.orderAdded = false;
    $scope.itemid = 0;
    $scope.cartNo = id;
    $scope.searchText = '';
    $scope.incorrectElements;
    $scope.isConfirm = false;
    $scope.creditLimitMode = 2;
    $scope.stockLevelMode = 0;
    var showInfoThenExecute = function (message, action, timeOut) {
        if (timeOut === void 0) { timeOut = 1500; }
        var options = {};
        options.timeOut = timeOut;
        var jq = toastrService.info(message, "", options);
        $timeout(function () {
            toastrService.clear(jq);
            action();
        }, timeOut);
    };
    $scope.onAttributeDataChange = function (attribute) {
        if ($scope.configuration.applicationId == 1 && attribute.type == 1) {
            if (attribute.value == "" && attribute.flagSelected != null)
                attribute.value = attribute.flagSelected.id.toString();
            else
                return;
        }
        attribute.fillRequired = !(attribute.value != '' || (attribute.value != '0' && attribute.type == 3));
        $http.put("api/Carts/attributeChanged", {
            headerId: $scope.headerId,
            type: attribute.type,
            itemId: 0,
            attributeClassId: attribute.attributeClassId,
            value: attribute.type == 1 ? attribute.flagSelected.id : attribute.value,
            documentId: $scope.selectedDocument.id,
            applicationId: $scope.configuration.applicationId
        });
    };
    var now = new Date();
    var currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    //for datepickers
    $scope.dateOptions = {
        culture: cultureService.getKendoCulture()
    };
    $scope.expectedDate = currentDate;
    $scope.dueDate = currentDate;
    //payment forms   
    $scope.paymentForms;
    var getPaymentForms = function () {
        var deferred = $q.defer();
        if (typeof $scope.paymentForms === "undefined") {
            $http.get("api/carts/paymentForms/" + id)
                .then(function (results) {
                $scope.paymentForms = results.data;
                deferred.resolve($scope.paymentForms);
            }, function () {
                $scope.paymentForms = [];
                deferred.resolve($scope.paymentForms);
            });
        }
        else
            deferred.resolve($scope.paymentForms);
        return deferred.promise;
    };
    $scope.selectPaymentFormOptions = {
        query: function (query) {
            var results = [];
            getPaymentForms().then(function (d) {
                $.each(d, function (index, item) {
                    results.push({
                        id: item.id,
                        text: item.name
                    });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; },
        showSearchInput: false
    };
    //shipping addresses
    $scope.shippingAddresses;
    var getShippingAddresses = function () {
        var deferred = $q.defer();
        if (typeof $scope.shippingAddresses === "undefined") {
            $http.get("api/carts/shippingAddresses/" + id)
                .then(function (results) {
                $scope.shippingAddresses = results.data;
                deferred.resolve($scope.shippingAddresses);
            }, function () {
                $scope.shippingAddresses = [];
                deferred.resolve($scope.shippingAddresses);
            });
        }
        else
            deferred.resolve($scope.shippingAddresses);
        return deferred.promise;
    };
    $scope.selectShippingAddressOptions = {
        query: function (query) {
            var results = [];
            getShippingAddresses().then(function (d) {
                $.each(d, function (index, item) {
                    results.push({
                        id: item.id,
                        text: item.name
                    });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; },
        showSearchInput: false
    };
    //flags    
    $scope.flags;
    var getFlags = function () {
        var deferred = $q.defer();
        if (typeof $scope.flags === "undefined") {
            $scope.flags = [
                { id: 0, name: $rootScope.resources.falseString }
            ];
            $scope.flags.push({ id: 1, name: $rootScope.resources.trueString });
            deferred.resolve($scope.flags);
        }
        else
            deferred.resolve($scope.flags);
        return deferred.promise;
    };
    // documents
    $scope.selectedDocument = { id: 0, text: $rootScope.resources.so };
    $scope.documents;
    var getDocuments = function () {
        var deferred = $q.defer();
        if (typeof $scope.documents === "undefined") {
            $scope.documents = [
                { id: 0, name: $rootScope.resources.so }
            ];
            if ($scope.configuration.createInquiries)
                $scope.documents.push({ id: 1, name: $rootScope.resources.si });
            deferred.resolve($scope.documents);
        }
        else
            deferred.resolve($scope.documents);
        return deferred.promise;
    };
    $scope.selectDocumentOptions = {
        query: function (query) {
            var results = [];
            getDocuments().then(function (d) {
                $.each(d, function (index, item) {
                    results.push({
                        id: item.id,
                        text: item.name
                    });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; },
        showSearchInput: false
    };
    // completionEntirely;
    $scope.completions;
    var getCompletions = function () {
        var deferred = $q.defer();
        if (typeof $scope.completions === "undefined") {
            $scope.completions = [
                { id: '0', name: $rootScope.resources.partialCompletion },
                { id: '1', name: $rootScope.resources.entireCompletion }
            ];
            deferred.resolve($scope.completions);
        }
        else
            deferred.resolve($scope.completions);
        return deferred.promise;
    };
    $scope.selectCompletionEntirelyOptions = {
        query: function (query) {
            var results = [];
            getCompletions().then(function (d) {
                $.each(d, function (index, item) {
                    results.push({
                        id: item.id,
                        text: item.name
                    });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; },
        showSearchInput: false
    };
    // delivery methods
    $scope.deliveryMethods;
    var getDeliveryMethods = function () {
        var deferred = $q.defer();
        if (typeof $scope.deliveryMethods === "undefined") {
            $http.get("api/carts/deliveryMethods/" + id)
                .then(function (results) {
                $scope.deliveryMethods = results.data;
                deferred.resolve($scope.deliveryMethods);
            }, function () {
                $scope.deliveryMethods = [];
                deferred.resolve($scope.deliveryMethods);
            });
        }
        else
            deferred.resolve($scope.deliveryMethods);
        return deferred.promise;
    };
    $scope.selectDeliveryMethodOptions = {
        query: function (query) {
            var results = [];
            getDeliveryMethods().then(function (d) {
                $.each(d, function (index, item) {
                    results.push({
                        id: index + 1,
                        text: item.translationName,
                        value: item.name
                    });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; },
        showSearchInput: false
    };
    // warehouses
    var getDefaultWarehouse = function () {
        return { id: 0, name: $rootScope.resources.allWarehouse };
    };
    $scope.warehouses;
    var getWarehouses = function () {
        var deferred = $q.defer();
        if (typeof $scope.warehouses === "undefined") {
            //to do: inny serwis
            $http.get("api/items/warehouses")
                .then(function (results) {
                $scope.warehouses = results.data;
                deferred.resolve($scope.warehouses);
            });
        }
        else
            deferred.resolve($scope.warehouses);
        return deferred.promise;
    };
    $scope.selectWarehouseOptions = {
        placeholder: $rootScope.resources.allWarehouse,
        query: function (query) {
            var results = [];
            getWarehouses().then(function (d) {
                var defaultWarehouse = getDefaultWarehouse();
                results.push({ id: defaultWarehouse.id, text: defaultWarehouse.name });
                $.each(d, function (index, item) {
                    if (_.str.startsWith(item.name.toLowerCase(), query.term))
                        results.push({
                            id: item.id,
                            text: item.name
                        });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; }
    };
    $scope.pageSize = 22;
    $scope.currentPage = 0;
    $scope.showPager = false;
    $scope.backPage = false;
    $scope.nextPage = false;
    $scope.currentView = $rootScope.currentView ? 'largetiles' : 'datagrid'; //BB Modyfikacja
    $scope.changeView = function (mode) {
        $scope.currentView = mode === 'largetiles' ? 'datagrid' : 'largetiles';
        $rootScope.currentView = mode === 'datagrid' ? 0 : 1; //BB Modyfikacja
    };
    $scope.completionEntirely = {};
    $scope.shippingAddress = {};
    $scope.deliveryMethod = {};
    $scope.warehouse = {};
    $scope.paymentForm = {};
    $scope.sourceNumber = '';
    $scope.sourceNumberSI = '';
    $scope.description = '';
    $scope.descriptionSI = '';
    $scope.summaryCount = false;
    var notifyChanges = false;
    $scope.search = function (searchText) {
        var doSearch = false;
        if (searchText.length > 2) {
            var transformText = _.str.words(searchText);
            for (var i = 0, l = transformText.length; i < l; i++) {
                transformText[i] = _.str.trim(transformText[i], "-_.&`@':/\\");
                if (transformText[i].length > 2) {
                    doSearch = true;
                    $scope.load();
                    break;
                }
            }
            if (!doSearch)
                toastrService.info($rootScope.resources.phraseTooShort, "", { timeOut: 1500 });
        }
        else {
            if (searchText.length == 0)
                $scope.load();
            else
                toastrService.info($rootScope.resources.phraseTooShort, "", { timeOut: 1500 });
        }
    };
    var createQuery = function (skip, top) {
        //if ($rootScope.selectedDocument)
        //    $scope.selectedDocument = $rootScope.selectedDocument;
        return "filter=" + encodeURIComponent($scope.searchText) + "&id=" + id + "&selectedDocument=" + $scope.selectedDocument.id + "&skip=" + skip + "&top=" + top;
    };
    $scope.load = function () {
        $scope.currentPage = 0;
        lazyLoad();
    };
    var lazyLoad = function () {
        var q = createQuery($scope.pageSize * $scope.currentPage + 1, $scope.pageSize);
        $scope.isBusy = true;
        $http.get("api/carts/?" + q)
            .then(function (result) {
            $scope.data = {
                header: result.data.items.set3,
                summaries: result.data.items.set5,
            };
            if (result.data.items.set4.length > 0 && $scope.selectedDocument.id == 0)
                $scope.attributes = changeAttributes(result.data.items.set4);
            else
                $scope.attributesSI = changeAttributes(result.data.items.set4);
            $scope.summaryCount = $scope.data.summaries.length === 1;
            if (result.data.items.set7.length > 0)
                $scope.data.volume = result.data.items.set7;
            $scope.headerId = $scope.data.header[0].headerId;
            $scope.configuration.getDeliveryCost = $scope.data.header[0].isDeliveryCost;
            $scope.configuration.deliveryMethodChange = $scope.data.header[0].deliveryMethodChange;
            $scope.configuration.receiptDateChange = $scope.data.header[0].receiptDateChange;
            $scope.configuration.showDeliveryMethod = $scope.data.header[0].showDeliveryMethod;
            $scope.configuration.showCompletion = $scope.data.header[0].showCompletion;
            $scope.configuration.showDiscount = $scope.data.header[0].showDiscount;
            $scope.configuration.paymentFormChange = $scope.data.header[0].paymentFormChange;
            $scope.configuration.paymentDateChange = $scope.data.header[0].paymentDateChange;
            $scope.configuration.warehouseChange = $scope.data.header[0].warehouseChange;
            $scope.configuration.showFeatures = $scope.data.header[0].showFeatures;
            $scope.configuration.createInquiries = $scope.data.header[0].createInquiries;
            $scope.stockLevelMode = $scope.data.header[0].stockLevelMode;
            $scope.isConfirm = $scope.data.header[0].isConfirm == 1;
            $scope.creditLimitMode = $scope.data.header[0].creditLimitMode;
            if (result.data.items.set2) {
                $scope.configuration.showImages = result.data.items.set2[0].showImages;
                $scope.configuration.showCode = result.data.items.set2[0].showCode;
                $scope.configuration.showPrice = result.data.items.set2[0].pricesVisibility;
                $scope.configuration.showState = result.data.items.set2[0].showState;
                $scope.configuration.stateMode = result.data.items.set2[0].stateMode;
                $scope.configuration.stateAvailableColor = result.data.items.set2[0].stateAvailableColor;
                $scope.configuration.stateNoneColor = result.data.items.set2[0].stateNoneColor;
                $scope.configuration.applicationId = result.data.items.set2[0].applicationId;
            }
            $scope.sourceNumber = $scope.data.header[0].sourceNumber;
            $scope.sourceNumberSI = $scope.data.header[0].sourceNumberSI;
            $scope.description = $scope.data.header[0].description;
            $scope.descriptionSI = $scope.data.header[0].descriptionSI;
            $scope.dueDate = dateHelper.stringToDate($scope.data.header[0].dueDate);
            $scope.receiptDate = dateHelper.stringToDate($scope.data.header[0].receiptDate);
            $scope.completionEntirely = {
                id: $scope.data.header[0].completionEntirely,
                text: $scope.data.header[0].completionEntirely === 0 ? $rootScope.resources.partialCompletion : $rootScope.resources.entireCompletion
            };
            $scope.shippingAddress = {
                id: $scope.data.header[0].addressId,
                text: $scope.data.header[0].address
            };
            $scope.deliveryMethod = {
                id: 0,
                text: $scope.data.header[0].translationDeliveryMethod,
                value: $scope.data.header[0].deliveryMethod
            };
            $scope.warehouse = {
                id: $scope.data.header[0].warehouseId,
                text: $scope.data.header[0].warehouseName
            };
            $scope.paymentForm = {
                id: $scope.data.header[0].paymentFormId,
                text: $scope.data.header[0].paymentForm
            };
            for (var i = 0, l = result.data.items.set1.length; i < l; i++) {
                $scope.calculateValues(result.data.items.set1[i], $scope.data.header[0].vatDirection);
            }
            $scope.data.items = result.data.items.set1;
            $scope.noResults = result.data.items.set1.length === 0;
            var hasMore = result.data.hasMore;
            if ($scope.currentPage === 0)
                $scope.showPager = hasMore;
            if ($scope.showPager) {
                $scope.nextPage = hasMore;
                $scope.backPage = $scope.currentPage !== 0;
            }
            notifyChanges = true;
            $scope.isBusy = false;
        }, function () {
            $scope.isBusy = false;
        });
    };
    $scope.nextClicked = function () {
        $scope.currentPage++;
        lazyLoad();
    };
    $scope.backClicked = function () {
        $scope.currentPage--;
        lazyLoad();
    };
    $scope.load();
    $scope.onHeaderDataChange = function (changedField, parameterId, parameterValue) {
        if (!notifyChanges)
            return;
        var shippingAddress = this.shippingAddress;
        var completionEntirely = this.completionEntirely;
        var deliveryMethod = this.deliveryMethod;
        var paymentForm = this.paymentForm;
        var warehouse = this.warehouse;
        var receiptDate = this.receiptDate;
        var dueDate = this.dueDate;
        if (parameterId === 0)
            $scope.description = parameterValue;
        else if (parameterId === 1)
            $scope.descriptionSI = parameterValue;
        else if (parameterId === 2)
            $scope.sourceNumber = parameterValue;
        else if (parameterId === 3)
            $scope.sourceNumberSI = parameterValue;
        $http.put("api/carts/updateCartHeader", {
            cartId: id,
            changedField: changedField,
            addressId: shippingAddress.id,
            completionEntirely: ($scope.configuration.showCompletion) ? completionEntirely.id : null,
            receiptDate: ($scope.configuration.receiptDateChange) ? dateHelper.dateToString(receiptDate) : null,
            description: $scope.description,
            descriptionSI: $scope.descriptionSI,
            deliveryMethod: ($scope.configuration.deliveryMethodChange && $scope.configuration.showDeliveryMethod) ? deliveryMethod.value : null,
            sourceNumber: $scope.sourceNumber,
            sourceNumberSI: $scope.sourceNumberSI,
            paymentFormId: ($scope.configuration.paymentFormChange) ? paymentForm.id : null,
            paymentDate: ($scope.configuration.paymentDateChange) ? dateHelper.dateToString(dueDate) : null,
            warehouseId: ($scope.configuration.warehouseChange) ? warehouse.id : null
        })
            .then(function (result) {
            if (parameterId != undefined)
                return;
            if (changedField !== 7) {
                var data1 = result.data[0];
                $scope.data.summaries = data1.set1;
                $scope.data.volume = data1.set3;
            }
            var index = (changedField !== 7) ? 1 : 0;
            var data2 = result.data[index];
            if (data2.set1) {
                $.each($scope.data.items, function (index, item) {
                    var position = (_.find(data2.set1, function (p) { return p.itemId === item.itemId; }));
                    if (position) {
                        if (position.subtotalPrice !== undefined && position.totalPrice !== undefined)
                            item.price = $scope.data.header[0].vatDirection === 'N' ? position.subtotalPrice : position.totalPrice;
                        if (position.discount !== undefined)
                            item.discount = position.discount;
                        if (position.subtotalValue !== undefined)
                            item.subtotalValue = position.subtotalValue;
                        if (position.totalValue !== undefined)
                            item.totalValue = position.totalValue;
                        if (position.type !== undefined && position.stockLevel !== undefined) {
                            item.type = position.type;
                            item.stockLevel = position.stockLevel;
                            $scope.calculateState(item);
                        }
                    }
                });
            }
            if (data2.set3 && data2.set3[0]) {
                if (data2.set3[0].paymentDate !== undefined)
                    $scope.dueDate = dateHelper.addDays(currentDate, data2.set3[0].paymentDate);
                if (data2.set3[0].getDeliveryCost !== undefined)
                    $scope.configuration.getDeliveryCost = data2.set3[0].getDeliveryCost;
            }
        }, function () {
        });
    };
    $scope.onItemDataChange = function (itemId) {
        if (!notifyChanges)
            return;
        $http.put("api/carts/updateCartItem", {
            itemId: itemId,
            //to do:
            //defaultUnitNo: defaultUnitNo,
            //quantity: quantity,                                            
            feature: $scope.featureValue.value,
            description: $scope.description
        })
            .then(function () {
        }, function () {
        });
    };
    var addOrderInternal = function () {
        $http.post("api/orders/addorder", "=" + id, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        })
            .then(function (result) {
            $scope.isBusy = false;
            cartService.refresh();
            var error = result.data.error;
            if (error) {
                if (error.isLicense)
                    toastrService.info(error.message, "", { timeOut: 1500 });
                else
                    toastrService.info($rootScope.resources.orderNotGenerated, "", { timeOut: 1500 });
            }
            else {
                showInfoThenExecute(_.str.sprintf($rootScope.resources.orderGenerated, result.data.set1[0].number), function () {
                    $location.path("/Orders");
                });
            }
        }, function () {
        });
    };
    $scope.addOrder = function () {
        $scope.orderAdded = true;
        $scope.isBusy = true;
        if ($scope.configuration.applicationId === 1)
            $http.get("api/carts/checkUnits?cartId=" + id + "&documentTypeId=" + 13)
                .then(function (result) {
                var results = result.data;
                $scope.incorrectElements = null;
                if (results.set1.length > 0)
                    for (var i = 0; i < results.set1.length; i++) {
                        if (i === 0)
                            $scope.incorrectElements = results.set1[i]["code"];
                        else
                            $scope.incorrectElements = $scope.incorrectElements + ", " + results.set1[i]["code"];
                    }
                handleOrderMessages();
            });
        else
            handleOrderMessages();
    };
    var handleOrderMessages = function () {
        if ($scope.stockLevelMode === 0 && $scope.creditLimitMode === 2 && !$scope.incorrectElements) {
            addOrderInternal();
        }
        else {
            $http.get("api/carts/exceededStates/" + id)
                .then(function (result) {
                var results = result.data;
                var countAlerts = 0;
                var deferred = $q.defer();
                if ($scope.stockLevelMode !== 0 && results.set1.length > 0) {
                    if ($scope.stockLevelMode === 1) {
                        $dialog.messageBox($rootScope.resources.generatingOrder, $rootScope.resources.exceededCartItemsStatesMessage, [{ result: 'yes', label: $rootScope.resources.placeOrder }, { result: 'no', label: $rootScope.resources.dialogCancel }])
                            .open()
                            .then(function (result) {
                            if (result === 'yes')
                                deferred.resolve();
                            else {
                                $scope.isBusy = false;
                                $scope.orderAdded = false;
                                deferred.reject();
                            }
                        });
                    }
                    else if ($scope.stockLevelMode === 2) {
                        $dialog.messageBox($rootScope.resources.generatingOrder, $rootScope.resources.exceededCartItemsStatesMessage, [{ result: 'no', label: $rootScope.resources.dialogCancel }])
                            .open();
                        deferred.reject();
                        countAlerts++;
                        $scope.isBusy = false;
                        $scope.orderAdded = false;
                    }
                }
                else {
                    deferred.resolve();
                }
                var promise = deferred.promise.then(function () {
                    var deferred2 = $q.defer();
                    var checkCreditLimit = false;
                    if (results.set2.length > 0)
                        checkCreditLimit = results.set2[0].exceededCreditLimit;
                    if (checkCreditLimit && $scope.creditLimitMode !== 2) {
                        if ($scope.creditLimitMode === 1 || ($scope.creditLimitMode === 0 && !$scope.isConfirm)) {
                            $dialog.messageBox($rootScope.resources.generatingOrder, $rootScope.resources.creditLimitMessage, [{ result: 'yes', label: $rootScope.resources.placeOrder }, { result: 'no', label: $rootScope.resources.dialogCancel }])
                                .open()
                                .then(function (result) {
                                if (result === 'yes')
                                    deferred2.resolve();
                                else {
                                    $scope.isBusy = false;
                                    $scope.orderAdded = false;
                                    deferred2.reject();
                                }
                            });
                        }
                        else if ($scope.creditLimitMode === 0 && $scope.isConfirm) {
                            $dialog.messageBox($rootScope.resources.generatingOrder, $rootScope.resources.creditLimitMessage, [{ result: 'no', label: $rootScope.resources.dialogCancel }])
                                .open();
                            deferred2.reject();
                            $scope.isBusy = false;
                            $scope.orderAdded = false;
                        }
                        countAlerts++;
                    }
                    else {
                        deferred2.resolve();
                    }
                    return deferred2.promise;
                });
                promise.then(function () {
                    if ($scope.incorrectElements)
                        $dialog.messageBox($rootScope.resources.generatingOrder, _.str.sprintf($rootScope.resources.incorrectUnits, $scope.incorrectElements), [{ result: 'yes', label: $rootScope.resources.placeOrder }, { result: 'no', label: $rootScope.resources.dialogCancel }])
                            .open()
                            .then(function (result) {
                            if (result === 'no') {
                                $scope.isBusy = false;
                                $scope.orderAdded = false;
                            }
                            else
                                addOrderInternal();
                        });
                    else if (countAlerts === 0)
                        $dialog.messageBox($rootScope.resources.generatingOrder, $rootScope.resources.orderingConfirmation, [{ result: 'yes', label: $rootScope.resources.placeOrder }, { result: 'no', label: $rootScope.resources.dialogCancel }])
                            .open()
                            .then(function (result) {
                            if (result === 'no') {
                                $scope.isBusy = false;
                                $scope.orderAdded = false;
                            }
                            else
                                addOrderInternal();
                        });
                    else
                        addOrderInternal();
                });
            }, function () {
                $scope.isBusy = false;
                $scope.orderAdded = false;
            });
        }
    };
    var removeCartItemInternal = function (item) {
        var skip = $scope.pageSize * $scope.currentPage + 1;
        var top = $scope.pageSize;
        $http.delete("api/carts/removeCartItem?filter=" + encodeURIComponent($scope.searchText) + "&cartId=" + id + "&itemId=" + item.itemId + "&skip=" + skip + "&top=" + top).then(function (result) {
            cartService.refresh();
            var count = result.data.items.set1.length;
            //to do: kiedy usuwamy z tej samej
            if ($scope.currentPage !== 0 && count === $scope.pageSize)
                $scope.currentPage--;
            if (count === 0 && $scope.currentPage === 0)
                $location.path("/Items");
            else {
                if (result.data.items.set2) {
                    $scope.configuration.showImages = result.data.items.set2[0].showImages;
                    $scope.configuration.showCode = result.data.items.set2[0].showCode;
                    $scope.configuration.showPrice = result.data.items.set2[0].pricesVisibility;
                    $scope.configuration.showState = result.data.items.set2[0].showState;
                    $scope.configuration.stateMode = result.data.items.set2[0].stateMode;
                    $scope.configuration.stateAvailableColor = result.data.items.set2[0].stateAvailableColor;
                    $scope.configuration.stateNoneColor = result.data.items.set2[0].stateNoneColor;
                }
                for (var i = 0, l = count; i < l; i++)
                    $scope.calculateValues(result.data.items.set1[i], $scope.data.header[0].vatDirection);
                $scope.data.items = result.data.items.set1;
                var hasMore = result.data.hasMore;
                if ($scope.currentPage === 0)
                    $scope.showPager = hasMore;
                if ($scope.showPager) {
                    $scope.nextPage = hasMore;
                    $scope.backPage = $scope.currentPage !== 0;
                }
                if (result.data.items.set4)
                    $scope.data.summaries = result.data.items.set4;
                $scope.summaryCount = $scope.data.summaries.length === 1;
                if (result.data.items.set6)
                    $scope.data.volume = result.data.items.set6;
                if (item.bundleId)
                    handleSet(item, result.data.items.set1);
            }
            ;
        }, function () {
        });
    };
    var changeAttributes = function (items) {
        $scope.required = false;
        for (var i = 0; i < items.length; i++) {
            items[i].fillRequired = false;
            if (items[i].required)
                $scope.required = true;
            if (items[i].type == 1) {
                if (items[i].value != "" && items[i].value == 0)
                    items[i].flagSelected = { id: 0, text: $rootScope.resources.falseString };
                else if (items[i].value != "" && items[i].value == 1)
                    items[i].flagSelected = { id: 1, text: $rootScope.resources.trueString };
                items[i].selectFlagOptions = {
                    query: function (query) {
                        var results = [];
                        getFlags().then(function (d) {
                            $.each(d, function (index, item) {
                                results.push({
                                    id: item.id,
                                    text: item.name
                                });
                            });
                            query.callback({ results: results });
                        });
                    },
                    formatNoMatches: function () { return ""; },
                    formatSearching: function () { return ""; },
                    showSearchInput: false
                };
            }
            if (items[i].type == 3) {
                // if (items[i].value == '') items[i].value = 0;
                items[i].quantityOptions = {
                    upArrowText: $rootScope.resources.increaseValue,
                    downArrowText: $rootScope.resources.decreaseValue,
                    culture: cultureService.getKendoCulture(),
                    decimals: 4,
                    format: "n4",
                    min: 0,
                    max: 9999999.9999
                };
            }
        }
        return items;
    };
    var handleSet = function (item, result) {
        var items = $scope.data.items;
        if (item.setDocumentsType < 2)
            for (var ii = 0, l = items.length; ii < l; ii++) {
                for (var ir = 0, w = result.length; ir < w; ir++) {
                    if (items[ii].itemId == result[ir].itemId) {
                        items.splice(ii, 1);
                        result.splice[ir, 1];
                    }
                }
            }
        else if (item.setDocumentsType > 1)
            for (var ii = 0, l = items.length; ii < l; ii++) {
                for (var ir = 0, w = result.length; ir < w; ir++) {
                    if (items[ii].itemid == result[ir].itemId) {
                        items[ii].bundleId = null;
                        items[ii].bundleCode = null;
                        items[ii].bundleQuantity = null;
                        result.splice[ir, 1];
                    }
                }
            }
    };
    $scope.removeCartItem = function (item) {
        if (item.bundleId && item.setDocumentsType < 2)
            $dialog.messageBox($rootScope.resources.setModification, $rootScope.resources.deleteSetElement, [{ result: 'yes', label: $rootScope.resources.dialogYes }, { result: 'no', label: $rootScope.resources.dialogNo }])
                .open()
                .then(function (result) {
                if (result === 'yes') {
                    removeCartItemInternal(item);
                }
            });
        else if (item.bundleId && item.setDocumentsType > 1)
            $dialog.messageBox($rootScope.resources.setModification, $rootScope.resources.setElementModification, [{ result: 'yes', label: $rootScope.resources.dialogYes }, { result: 'no', label: $rootScope.resources.dialogNo }])
                .open()
                .then(function (result) {
                if (result === 'yes') {
                    removeCartItemInternal(item);
                }
            });
        else
            $dialog.messageBox($rootScope.resources.removeCartItemDialogTitle, _.str.sprintf($rootScope.resources.removeCartItemDialogMessage, item.name, id), [{ result: 'yes', label: $rootScope.resources.dialogYes }, { result: 'no', label: $rootScope.resources.dialogNo }])
                .open()
                .then(function (result) {
                if (result === 'yes') {
                    removeCartItemInternal(item);
                }
            });
    };
    $scope.calculateValues = function (item, vatDirection) {
        item.unit = (item.defaultUnitNo > 0) ? item.auxiliaryUnit : item.basicUnit;
        item.converter = (item.auxiliaryUnit === undefined || item.auxiliaryUnit == null) ? "" : _.str.sprintf("%s %s = %s %s", item.denominator, item.auxiliaryUnit, item.numerator, item.basicUnit);
        item.price = (vatDirection === 'N') ? item.subtotalPrice : item.totalPrice;
        item.vatDirection = (vatDirection === 'N') ? $rootScope.resources.s : $rootScope.resources.t;
        var quantityPrecision;
        if (item.unitPrecision)
            quantityPrecision = item.unitPrecision;
        else
            quantityPrecision = item.isUnitTotal ? 0 : 4;
        item.quantityOptions = {
            upArrowText: $rootScope.resources.increaseValue,
            downArrowText: $rootScope.resources.decreaseValue,
            culture: cultureService.getKendoCulture(),
            decimals: quantityPrecision,
            format: "n" + quantityPrecision,
            min: 0,
            max: 9999999.9999
        };
        item.cartId = id;
        if (!item.fromBinary)
            item.fromBinary = '';
        if (item.unitPrecision >= 0) {
            if (item.unitPrecision === 0) {
                item.quantity = Math.round(+item.quantity).toString();
            }
            var prec = -item.unitPrecision;
            item.quantity = item.quantity.toString().split('e');
            item.quantity = Math.round(+(item.quantity[0] + 'e' + (item.quantity[1] ? (+item.quantity[1] - prec) : -prec)));
            item.quantity = item.quantity.toString().split('e');
            item.quantity = (+(item.quantity[0] + 'e' + (item.quantity[1] ? (+item.quantity[1] + prec) : prec))).toFixed(item.unitPrecision);
        }
        $scope.calculateState(item);
    };
    $scope.calculateState = function (item) {
        if (item.type === 3 || item.type === 4) {
            item.state = "-";
        }
        else {
            var exists = !_.str.startsWith(item.stockLevel, "0");
            if ($scope.configuration.stateMode) {
                item.state = item.stockLevel;
                item.stateColor = (exists) ? $scope.configuration.stateAvailableColor : $scope.configuration.stateNoneColor;
            }
            else {
                item.state = (exists) ? $rootScope.resources.available : $rootScope.resources.none;
                item.stateColor = (exists) ? $scope.configuration.stateAvailableColor : $scope.configuration.stateNoneColor;
            }
        }
    };
	
		
	
	
	
    $scope.featureClassId = 0;
    $scope.featureValue = { id: 0, text: "", value: "" };
    var featureValues;
    var getFeatureValues = function () {
        var deferred = $q.defer();
        if ($scope.featureClassId) {
            $http.get("api/items/features/" + $scope.featureClassId)
                .then(function (results) {
                featureValues = results.data;
                deferred.resolve(featureValues);
            });
        }
        else {
            featureValues = [];
            deferred.resolve(featureValues);
        }
        return deferred.promise;
    };
    $scope.featureValuesOptions = {
        placeholder: 'Wszystkie',
        query: function (query) {
            var results = [];
            getFeatureValues().then(function (d) {
                results.push({ id: 0, text: "< Wszystkie >", value: "< Wszystkie >" });
                $.each(d, function (index, item) {
                    if (_.str.startsWith(item.name.toLowerCase(), query.term))
                        results.push({
                            id: query.term + index + 1,
                            text: item.tanslationName,
                            value: item.name
                        });
                });
                query.callback({ results: results });
            });
        },
        formatNoMatches: function () { return ""; },
        formatSearching: function () { return ""; }
    };
    $scope.showEditPanel = function () {
        var sidebar = angular.element(Utils.qs('.main-profiles'));
        var content = angular.element(Utils.qs('.add-scroll'));
        content.addClass("moved-right");
        sidebar.addClass("visible");
    };
    $scope.hideEditPanel = function () {
        var sidebar = angular.element(Utils.qs('.main-profiles'));
        var content = angular.element(Utils.qs('.add-scroll'));
        content.removeClass("moved-right");
        sidebar.removeClass("visible");
    };
    $scope.description = '';
    $scope.editCartItemDetails = function (item) {
        clearEditData();
        $scope.editingItem = item;
        cartService.closePanel();
        $scope.showEditPanel();
        $http.get("api/carts/cartItemDetails?cartId=" + id + "&itemId=" + item.itemId)
            .then(function (result) {
            if (result.data) {
                var data = result.data;
                $scope.itemId = item.itemId;
                if (data.set1) {
                    $scope.featureClassId = data.set1[0].id;
                    $scope.featureValue.text = data.set1[0].translationName;
                    $scope.featureValue.value = data.set1[0].name;
                }
                if (data.set2) {
                    $scope.description = data.set2[0].description;
                }
            }
        }, function () {
        });
    };
    var clearEditData = function () {
        $scope.description = '';
        $scope.featureClassId = 0;
        $scope.featureValue.text = "";
        $scope.featureValue.value = "";
        featureValues = [];
        featureValues.push({ name: "< Wszystkie >" });
    };
    $scope.saveCartItemDetails = function () {
        $scope.editingItem.description = $scope.description.trim();
        $scope.editingItem.feature = $scope.featureValue.value;
        $scope.hideEditPanel();
        clearEditData();
    };
    $scope.condition = $scope.configuration.showFeatures;
    $scope.onItemQuantityChange = function (item) {
        if (!notifyChanges)
            return;
        if (item.bundleId)
            $dialog.messageBox($rootScope.resources.setModification, $rootScope.resources.setElementModification, [{ result: 'yes', label: $rootScope.resources.dialogYes }, { result: 'no', label: $rootScope.resources.dialogNo }])
                .open()
                .then(function (result) {
                if (result === 'no') {
                    $http.get("api/carts/cartItemDetails?cartId=" + id + "&itemId=" + item.itemId)
                        .then(function (result) {
                        if (result.data) {
                            if (result.data.set2) {
                                item.quantity = result.data.set2[0].quantity;
                            }
                        }
                    }, function () {
                    });
                    return;
                }
                updateItemQuantityInternal(item);
				location.reload(); //BB Modyfikacja
            });
        else
            updateItemQuantityInternal(item);
			location.reload();  //BB Modyfikacja
    };
    var updateItemQuantityInternal = function (item) {
        $http.put("api/carts/updateItemQuantity", {
            itemId: item.itemId,
            cartId: id,
            quantity: item.quantity
        })
            .then(function (results) {
            if (results.data.set1.length > 0) {
                var element = results.data.set1[0];
                item.price = element.vatDirection === 0 ? element.subtotalPrice : element.totalPrice;
                item.discount = element.discount;
                item.subtotalValue = element.subtotalValue;
                item.totalValue = element.totalValue;
                //item.value = element.value;
                if (item.bundleId) {
                    var items_1 = $scope.data.items;
                    var result = element.alteredItems;
                    for (var ii = 0, l = items_1.length; ii < l; ii++) {
                        for (var ir = 0, w = result.length; ir < w; ir++) {
                            if (items_1[ii].itemId === result[ir].itemId) {
                                items_1[ii].bundleId = null;
                                items_1[ii].bundlecode = null;
                                items_1[ii].bundlequantity = null;
                                result.splice[ir, 1];
                            }
                        }
                    }
                }
            }
            if (results.data.set3.length > 0)
                $scope.data.summaries = results.data.set3;
            if (results.data.set5.length > 0)
                $scope.data.volume = results.data.set5;
        }, function () {
        });
    };
    $scope.cancelCartItemDetails = function () {
        $scope.hideEditPanel();
        clearEditData();
    };
    $scope.$on('closePanel', function () {
        $scope.hideEditPanel();
    });
    $scope.goBack = function () {
        $window.history.back();
    };
    $scope.addInquiry = function () {
        $scope.isBusy = true;
        if ($scope.configuration.applicationId === 1)
            $http.get("api/carts/checkUnits?cartId=" + id + "&documentTypeId=" + 54)
                .then(function (result) {
                $scope.incorrectElements = null;
                if (result.data.set1.length > 0)
                    for (var i = 0; i < result.data.set1.length; i++) {
                        if (i === 0)
                            $scope.incorrectElements = result.data.set1[i]["code"];
                        else
                            $scope.incorrectElements = $scope.incorrectElements + ", " + result.data.set1[i]["code"];
                    }
                if ($scope.incorrectElements)
                    $dialog.messageBox($rootScope.resources.generatingOrder, _.str.sprintf($rootScope.resources.incorrectUnits, $scope.incorrectElements), [{ result: 'yes', label: $rootScope.resources.placeOrder }, { result: 'no', label: $rootScope.resources.dialogCancel }])
                        .open()
                        .then(function (result) {
                        if (result === 'no') {
                            $scope.isBusy = false;
                            $scope.orderAdded = false;
                        }
                        else
                            addInquiryInternal();
                    });
                else
                    addInquiryInternal();
            });
        else
            addInquiryInternal();
    };
    var addInquiryInternal = function () {
        $http.post("api/Inquiries/addInquiry", "=" + id, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        })
            .then(function (result) {
            $scope.isBusy = false;
            cartService.refresh();
            var error = result.data.error;
            if (error) {
                if (error.isLicense)
                    toastrService.info(error.message, "", { timeOut: 1500 });
                else
                    toastrService.info($rootScope.resources.orderNotGenerated, "", { timeOut: 1500 });
            }
            else {
                showInfoThenExecute(_.str.sprintf($rootScope.resources.inquiryGenerated, result.data[0]), function () {
                    $location.path("/Inquiries");
                });
            }
        }, function () {
        });
    };
    $scope.updateDocument = function (document) {
        $rootScope.selectedDocument = document;
        if ($scope.attributes == undefined || $scope.attributesSI == undefined) {
            $http.get("api/carts/documentAttributes?headerId=" + $scope.headerId + "&cartId=" + id + "&documentId=" + document.id + "&itemId=0")
                .then(function (result) {
                if (document.id == 0)
                    $scope.attributes = changeAttributes(result.data.set1);
                else
                    $scope.attributesSI = changeAttributes(result.data.set1);
            });
        }
    };
    $scope.addDocument = function () {
        if ($scope.selectedDocument.text === $rootScope.resources.so) {
            var fillRequired = false;
            if ($scope.attributes)
                for (var i = 0; i < $scope.attributes.length; i++) {
                    if ($scope.attributes[i].required) {
                        if ($scope.attributes[i].value == '')
                            $scope.attributes[i].fillRequired = fillRequired = true;
                    }
                }
            if (fillRequired) {
                toastrService.error($rootScope.resources.fillRequiredFields, "", { timeOut: 1500 });
                return;
            }
            $scope.addOrder();
        }
        else {
            var fillRequired = false;
            if ($scope.attributesSI)
                for (var i = 0; i < $scope.attributesSI.length; i++) {
                    if ($scope.attributesSI[i].required) {
                        if ($scope.attributesSI[i].value == '')
                            $scope.attributesSI[i].fillRequired = fillRequired = true;
                    }
                }
            if (fillRequired) {
                toastrService.error($rootScope.resources.fillRequiredFields, "", { timeOut: 1500 });
                return;
            }
            $scope.addInquiry();
        }
    };
});
