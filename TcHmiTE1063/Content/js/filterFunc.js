// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.3.212/runtimes/native1.12-tchmi/TcHmi.d.ts" />

// This function filters a calibration data array.
// It assumes an "empty" row has a dateTime that is an empty string.
function filterCalibrationData(fullDataArray) {
    const filteredArray = [];
    for (let i = 0; i < fullDataArray.length; i++) {
        const row = fullDataArray[i];
        if (row.dateTime && row.dateTime.trim() !== '') {
            filteredArray.push(row);
        }
    }
    return filteredArray;
}
