// ===== Hash Router =====
var Router = (function() {
    'use strict';

    var routes = {};
    var currentRoute = null;
    var currentParam = null;

    function register(path, handler) {
        routes[path] = handler;
    }

    function handleRoute() {
        var hash = location.hash.slice(1) || '/';

        // Normalize: ensure starts with /
        if (hash.charAt(0) !== '/') hash = '/' + hash;

        // Parse: /quiz/java-basics → ['quiz', 'java-basics']
        var parts = hash.substring(1).split('/');
        var routeName = parts[0] || '';
        var param = parts[1] || null;

        // Strip trailing query params
        if (param && param.indexOf('?') !== -1) {
            param = param.split('?')[0];
        }

        currentRoute = routeName;
        currentParam = param;

        var handler = routes[routeName];
        if (handler) {
            handler(param);
        } else if (routeName === '') {
            // Empty hash → home
            var homeHandler = routes[''];
            if (homeHandler) homeHandler(null);
        } else {
            // Unknown route → redirect home
            navigate('/');
        }
    }

    function navigate(path) {
        location.hash = '#' + path;
    }

    function init() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    function getCurrentRoute() { return currentRoute; }
    function getCurrentParam() { return currentParam; }

    return {
        register: register,
        init: init,
        navigate: navigate,
        handleRoute: handleRoute,
        getCurrentRoute: getCurrentRoute,
        getCurrentParam: getCurrentParam
    };
})();
