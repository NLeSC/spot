module.exports = {
    steps: function() {
        return [
            // {
            //     element: document.getElementById('saveSessionButton'),
            //     position: "bottom",
            //     intro: "Ok, wasn't that fun?",
            // }
        ];
    },
    hints: function() {
        return [
            {
                element: document.getElementById('saveSessionButton'),
                hintPosition: "bottom",
                hint: "This buttons saves the current session."
            },
            {
                element: document.getElementById('resetFiltersButton'),
                hintPosition: "bottom",
                hint: "This buttons resets all the filters."
            }
        ];
    }    
};