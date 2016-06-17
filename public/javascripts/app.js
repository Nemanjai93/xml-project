var app = angular.module('myApp', ['ngRoute']).run(function ($rootScope, $http, $location, $window) {
	/*$rootScope.authenticated = false;
	$rootScope.current_user = "";*/

	$rootScope.loggedIn = function () {
		$http.post('/auth/isLoggedIn').success(function (data) {
			console.log(data.session);
			if(data.success) {
				$rootScope.authenticated = true;
				$rootScope.current_user = data.session.uniqueId;

				if($location.path() == '/')
					$location.path('/dashboard');
			} else {
				$rootScope.authenticated = false;
				$rootScope.current_user = "";
				$location.path('/');
			}
		});
	};

	$rootScope.loggedIn();

	$rootScope.logout = function () {
		$http.post('/auth/logout')
			.success(function (data) {
				$window.location.reload();
			})

		$rootScope.authenticated = false;
		$rootScope.current_user = "";	
	};
});

app.config(function ($routeProvider, $locationProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'login.html',
			controller: 'authController'
		})
		.when('/dashboard', {
			templateUrl: 'dashboard.html',
			controller: 'authController'
		})

		$locationProvider.html5Mode(true);
})

app.controller('authController', function ($scope, $rootScope, $http, $location) {
	$scope.user = {username: '', password: ''};
	$scope.error_message = '';

	$scope.login = function () {
		$http.post('/auth/login', $scope.user).success(function (data) {
			if(data.success) {
				$rootScope.authenticated = true;
				console.log(data);
				$rootScope.current_user = data.session.uniqueId;
				$location.path('/dashboard');
			}else {
				$scope.error_message = data.message;
			}
		});
	};

	$scope.getAllUsers = function () {
		$http.get('/auth/users').success(function (data) {
			console.log(data);
		});
	};

	$scope.getAllUsers();


});