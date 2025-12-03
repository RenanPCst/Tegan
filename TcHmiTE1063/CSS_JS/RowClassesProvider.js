// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../Packages/Beckhoff.TwinCAT.HMI.Framework.12.762.44/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {
    var Functions;
    (function (/** @type {globalThis.TcHmi.Functions} */ Functions) {
        var TcHmiTE1063;
        (function (TcHmiTE1063) {
            function RowClassesProvider(rowData, rowIndex, rowNumber) {
            }
            TcHmiTE1063.RowClassesProvider = RowClassesProvider;
        })(TcHmiTE1063 = Functions.TcHmiTE1063 || (Functions.TcHmiTE1063 = {}));
    })(Functions = TcHmi.Functions || (TcHmi.Functions = {}));
})(TcHmi);
TcHmi.Functions.registerFunctionEx('RowClassesProvider', 'TcHmi.Functions.TcHmiTE1063', TcHmi.Functions.TcHmiTE1063.RowClassesProvider);

(function (TcHmi) {

    var RecipeRowClassesProvider = function (rowData, rowIndex, rowNumber) {
        var classes = [];

        // Get the DataGrid control
        var dg = TcHmi.Controls.get('TcHmiDatagrid'); //DataGrid control name

        if (dg) {
            // Current selected row index in the DataGrid
            var selectedIndex = dg.getSelectedRowIndex();

            // If this row is the selected one, add our custom class
            if (selectedIndex === rowIndex) {
                classes.push('recipe-row-selected');
            }
        }

        return classes;
    };

    TcHmi.Functions.registerFunction('RecipeRowClassesProvider', RecipeRowClassesProvider);

})(TcHmi);