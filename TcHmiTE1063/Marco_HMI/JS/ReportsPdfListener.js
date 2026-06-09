// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.3.212/runtimes/native1.12-tchmi/TcHmi.d.ts" />
// ReportsPdfListener.js

(function () {
    let intervalHandle = null;
    let running = false;
    let errorLatched = false;

    const readSymbol = (symbol) => new Promise((resolve, reject) => {
        TcHmi.Symbol.readEx2('%s%' + symbol + '%/s%', data => {
            if (data.error === TcHmi.Errors.NONE) {
                resolve(data.value);
            } else {
                reject(data.error);
            }
        });
    });

    const writeSymbol = (symbol, value) => new Promise((resolve, reject) => {
        TcHmi.Symbol.writeEx('%s%' + symbol + '%/s%', value, data => {
            if (data.error === TcHmi.Errors.NONE) {
                resolve();
            } else {
                reject(data.error);
            }
        });
    });

    async function buildPumpCalibHeader() {
        const out = {};

        out.CalibrationNo = await readSymbol('PLC1.GVL_Reports.iPumpCalibNo');
        console.log('iPumpCalibNo ok');

        out.userID = await readSymbol('PLC1.GVL_Reports.sPumpCalibUserID');
        console.log('sPumpCalibUserID ok');

        out.density = await readSymbol('PLC1.GVL_Reports.sPumpCalibDensity');
        console.log('sPumpCalibDensity ok');

        out.solventNo = await readSymbol('PLC1.GVL_Reports.sPumpCalibSolventNo');
        console.log('sPumpCalibSolventNo ok');

        out.solventRevision = await readSymbol('PLC1.GVL_Reports.sPumpCalibSolventRev');
        console.log('sPumpCalibSolventRev ok');

        out.allowableFail = await readSymbol('PLC1.GVL_Reports.sPumpCalibAllowFail');
        console.log('sPumpCalibAllowFail ok');

        out.replicates = await readSymbol('PLC1.GVL_Reports.sPumpCalibReplicates');
        console.log('sPumpCalibReplicates ok');

        out.callInterval = await readSymbol('PLC1.GVL_Reports.sPumpCalibCallInterval');
        console.log('sPumpCalibCallInterval ok');

        out.sysRevisionNo = await readSymbol('PLC1.GVL_Reports.sPumpCalibSysRev');
        console.log('sPumpCalibSysRev ok');

        return out;
    }

    async function buildCompleteMethodHistoryData() {
        const methods = await readSymbol('PLC1.GVL_Reports.aCompleteMethodReport');
        return methods || [];
    }
    
    async function buildPumpCalibHeaderOld() {
        return {
            CalibrationNo: (await readSymbol('PLC1.GVL_Reports.iPumpCalibNo')) || '',
            userID: (await readSymbol('PLC1.GVL_Reports.sPumpCalibUserID')) || '',
            density: (await readSymbol('PLC1.GVL_Reports.sPumpCalibDensity')) || '',
            solventNo: (await readSymbol('PLC1.GVL_Reports.sPumpCalibSolventNo')) || '',
            solventRevision: (await readSymbol('PLC1.GVL_Reports.sPumpCalibSolventRev')) || '',
            allowableFail: (await readSymbol('PLC1.GVL_Reports.sPumpCalibAllowFail')) || '',
            replicates: (await readSymbol('PLC1.GVL_Reports.sPumpCalibReplicates')) || '',
            callInterval: (await readSymbol('PLC1.GVL_Reports.sPumpCalibCallInterval')) || '',
            sysRevisionNo: (await readSymbol('PLC1.GVL_Reports.sPumpCalibSysRev')) || ''
        };
    }

    async function buildSystemSettingsData() {
        const st = await readSymbol('PLC1.GVL_Reports.stSelectedSystemSettings');

        return {
            gen_SealAndPump: st ?.sGenSealAndPump || '',
            cal_AcceptanceCriteria: st ?.sCalAcceptanceCriteria || '',
            cal_AllowableFail: st ?.sCalAllowableFail || '',
            cal_Replicates: st ?.sCalReplicates || '',
            cal_PumpCallIntervalDays: st ?.sCalPumpCallIntervalDays || '',
            cal_CloseAppOnCompletation: st ?.sCalCloseAppOnCompletion || '',
            AirDryTimeOnCompletation: st ?.sAirDryTimeOnCompletion || '',
            lkt_AllowableLeakTestFail: st ?.sLktAllowableLeakTestFail || '',
            lkt_LeakTestBuildupTime: st ?.sLktLeakTestBuildUpTime || '',
            lkt_LeakTestHoldTime: st ?.sLktLeakTestHoldTime || '',
            lkt_LeakTestPressure: st ?.sLktLeakTestPressure || '',
            mec_PlatesClosedPosition: st ?.sMecPlatesClosedPosition || '',
            mec_PlatesDryPosition: st ?.sMecPlatesDryPosition || '',
            mec_PlatesVelocity: st ?.sMecPlatesVelocity || '',
            mec_MaxCurrentFastDown: st ?.sMecMaxCurrentFastDown || '',
            mec_MaxCurrentSlowDown: st ?.sMecMaxCurrentSlowDown || '',
            mec_MaxCurrentSlowUp: st ?.sMecMaxCurrentSlowUp || '',
            pmp_MeterVelocity: st ?.sPmpMeterVelocity || '',
            pmp_RunVelocity: st ?.sPmpRunVelocity || '',
            pmp_EmptyFactor: st ?.sPmpEmptyFactor || '',
            pmp_FillSolventTubesFactor: st ?.sPmpFillSolventTubesFactor || '',
            smp_AboveCalibration: st ?.sSmpAboveCalibration || '',
            smp_VialSetSpacing: st ?.sSmpVialSetSpacing || '',
            smp_IntoResBottom: st ?.sSmpIntoResBottom || '',
            smp_IntoResDispense: st ?.sSmpIntoResDispense || '',
            smp_IntoResWeigh: st ?.sSmpIntoResWeigh || '',
            smp_IntoVials: st ?.sSmpIntoVials || '',
            smp_IntoWaste: st ?.sSmpIntoWaste || '',
            sec_DisplayManualControl: st ?.sSecDisplayManualControl || '',
            sec_CheckLogonEachRun: st ?.sSecCheckLogonEachRun || '',
            createdBy: st ?.sCreatedBy || '',
            createdDate: st ?.sCreatedDate || '',
            sysRevisionNo: st ?.sSysRevisionNo || ''
        };
    }

    async function finishHandshakeAfterAttempt() {
        try {
            await writeSymbol('PLC1.GVL_Reports.bPdfConsumed', true);
        } catch (e) {
            console.error('Could not finish PDF handshake:', e);
        }
    }

    async function buildRecipeData() {
        const methodHeader = await readSymbol('PLC1.GVL_Reports.stMethodHeader');
        const volumeData = await readSymbol('PLC1.GVL_Reports.aMethodVolumeData');

        return {
            methodHeader: methodHeader || {},
            volumeData: volumeData || []
        };
    }

    async function buildPostRunData() {
        const runHeader = await readSymbol('PLC1.GVL_Reports.stRunHeader');
        const methodHeader = await readSymbol('PLC1.GVL_Reports.stRunMethodHeader');
        const volumeData = await readSymbol('PLC1.GVL_Reports.aRunVolumeData');

        return {
            runHeader: runHeader || {},
            methodHeader: methodHeader || {},
            volumeData: volumeData || []
        };
    }

    async function buildLinearHistoryData() {
        const linearHistory = await readSymbol('PLC1.GVL_Reports.aLinearHistory');
        return linearHistory || [];
    }

    async function buildPumpCalibHeaderFromStruct() {
        const st = await readSymbol('PLC1.GVL_Reports.stSelectedCalibReportHeader');

        return {
            CalibrationNo: st ?.sCalibrationNo || '',
            userID: st ?.sUserId || '',
            density: st ?.sDensity || '',
            solventNo: st ?.sSolventNo || '',
            solventRevision: st ?.sSolventRevision || '',
            allowableFail: st ?.sAllowableFail || '',
            replicates: st ?.sReplicates || '',
            callInterval: st ?.sCallInterval || '',
            sysRevisionNo: st ?.sSysRevisionNo || ''
        };
    }

    async function buildLinearData() {
        const linearReport = await readSymbol('PLC1.GVL_Reports.stLinearReport');

        return linearReport || {};
    }

    async function buildSystemHistoryData() {
        const sysHistory = await readSymbol('PLC1.GVL_Reports.aSystemHistory');
        return sysHistory || [];
    }

    async function processPdfIfReady() {
        if (running) return;
        running = true;

        try {
            const pdfReady = await readSymbol('PLC1.GVL_Reports.bPdfDataReady');

            if (!pdfReady) {
                errorLatched = false;
                return;
            }

            if (errorLatched) return;

            const reportType = await readSymbol('PLC1.GVL_Reports.eSelectedReportType');

            let quickReportName = '';
            try {
                quickReportName = await readSymbol('PLC1.GVL_Reports.sQuickReportName');
            } catch (e) {
                quickReportName = '';
            }

            if (quickReportName === 'SystemHistory') {
                if (typeof genSysHistoryReport !== 'function') {
                    throw new Error('System history PDF function was not found.');
                }

                let sysHistory = null;
                try {
                    sysHistory = await readSymbol('PLC1.GVL_Reports.aSystemHistory');
                    console.log('aSystemHistory ok:', sysHistory);
                } catch (e) {
                    console.error('aSystemHistory failed:', e);
                    throw new Error('aSystemHistory read failed: ' + e);
                }

                genSysHistoryReport(sysHistory || [], '502 - System Settings Report History');
                await finishHandshakeAfterAttempt();
                return;
            }

            if (Number(reportType) === 2) {
                const sysData = await buildSystemSettingsData();
                const reportName = String(sysData.sysRevisionNo || '') + ' - System Settings Report';

                console.log('System Settings data:', sysData);
                console.log('System Settings report name:', reportName);

                if (typeof genCurrentSysReport !== 'function') {
                    throw new Error('System settings PDF function was not found.');
                }

                genCurrentSysReport(sysData, reportName);
                await finishHandshakeAfterAttempt();
                return;
            }

            if (quickReportName === 'LinearHistory') {
                if (typeof genLinearHistoryReport !== 'function') {
                    throw new Error('Linear history PDF function was not found.');
                }

                let linearHistory = null;
                try {
                    linearHistory = await readSymbol('PLC1.GVL_Reports.aLinearHistory');
                    console.log('aLinearHistory ok:', linearHistory);
                } catch (e) {
                    console.error('aLinearHistory failed:', e);
                    throw new Error('aLinearHistory read failed: ' + e);
                }

                genLinearHistoryReport(linearHistory || [], '602 - Linear Pumps Position History');
                await finishHandshakeAfterAttempt();
                return;
            }

            if (Number(reportType) === 1) {
                if (typeof genPumpCalibrationReport !== 'function') {
                    throw new Error('Pump calibration PDF function was not found.');
                }

                console.log('Pump Calibration: starting reads...');

                let stHeader = null;
                try {
                    stHeader = await readSymbol('PLC1.GVL_Reports.stSelectedCalibReportHeader');
                    console.log('stSelectedCalibReportHeader ok:', stHeader);
                } catch (e) {
                    console.error('stSelectedCalibReportHeader failed:', e);
                    throw new Error('stSelectedCalibReportHeader read failed: ' + e);
                }

                let values = null;
                try {
                    values = await readSymbol('PLC1.GVL_Reports.aPumpCalibValues');
                    console.log('aPumpCalibValues ok:', values);
                } catch (e) {
                    console.error('aPumpCalibValues failed:', e);
                    throw new Error('aPumpCalibValues read failed: ' + e);
                }

                const header = {
                    CalibrationNo: stHeader ?.sCalibrationNo || '',
                    userID: stHeader ?.sUserId || '',
                    density: stHeader ?.sDensity || '',
                    solventNo: stHeader ?.sSolventNo || '',
                    solventRevision: stHeader ?.sSolventRevision || '',
                    allowableFail: stHeader ?.sAllowableFail || '',
                    replicates: stHeader ?.sReplicates || '',
                    callInterval: stHeader ?.sCallInterval || '',
                    sysRevisionNo: stHeader ?.sSysRevisionNo || ''
                };

                const reportName = 'Pump Calibration Report - ID ' + String(header.CalibrationNo || '');

                genPumpCalibrationReport(values || [], header, reportName);
                await finishHandshakeAfterAttempt();
                return;
            }

            if (quickReportName === 'CompleteMethodHistory') {
                if (typeof genCompleteMethodReport !== 'function') {
                    throw new Error('Complete method history PDF function was not found.');
                }

                let methodHistory = null;
                try {
                    methodHistory = await readSymbol('PLC1.GVL_Reports.aCompleteMethodReport');
                    console.log('aCompleteMethodReport ok:', methodHistory);
                } catch (e) {
                    console.error('aCompleteMethodReport failed:', e);
                    throw new Error('aCompleteMethodReport read failed: ' + e);
                }

                genCompleteMethodReport(methodHistory || [], '603 - Complete Method Report');
                await finishHandshakeAfterAttempt();
                return;
            }

            if (Number(reportType) === 5) {
                if (typeof genMethodReport !== 'function') {
                    throw new Error('Recipe PDF function was not found.');
                }

                const recipeData = await buildRecipeData();
                const methodHeader = recipeData.methodHeader;
                const volumeData = recipeData.volumeData;

                const reportName =
                    'Recipe Report - ID ' + String(methodHeader.methodID || '');

                console.log('Recipe method header:', methodHeader);
                console.log('Recipe volume data:', volumeData);

                genMethodReport(methodHeader, volumeData, reportName);
                await finishHandshakeAfterAttempt();
                return;
            }

            if (Number(reportType) === 3) {
                if (typeof genPostRunReport !== 'function') {
                    throw new Error('Post run PDF function was not found.');
                }

                const postRunData = await buildPostRunData();
                const runHeader = postRunData.runHeader;
                const methodHeader = postRunData.methodHeader;
                const volumeData = postRunData.volumeData;

                const reportName =
                    'Post Run Report - ID ' + String(runHeader.runNo || '');

                console.log('Post Run header:', runHeader);
                console.log('Post Run method header:', methodHeader);
                console.log('Post Run volume data:', volumeData);

                genPostRunReport(runHeader, methodHeader, volumeData, reportName);
                await finishHandshakeAfterAttempt();
                return;
            }

            if (Number(reportType) === 4) {
                if (typeof genLinearReport !== 'function') {
                    throw new Error('Linear pumps PDF function was not found.');
                }

                const linearData = await buildLinearData();
                const reportName =
                    'Linear Pumps Report - ID ' + String(linearData.ID_Linear || '');

                console.log('Linear report data:', linearData);

                genLinearReport(linearData, reportName);
                await finishHandshakeAfterAttempt();
                return;
            }

            throw new Error('Unsupported report type: ' + String(reportType));

        } catch (e) {
            console.error('ReportsPdfListener failed:', e);
            errorLatched = true;
            await finishHandshakeAfterAttempt();
            alert('Could not generate the selected report PDF: ' + e);
        } finally {
            running = false;
        }
    }

    window.startReportsPdfListener = function () {
        if (intervalHandle) {
            clearInterval(intervalHandle);
        }

        intervalHandle = setInterval(processPdfIfReady, 800);
    };

    window.stopReportsPdfListener = function () {
        if (intervalHandle) {
            clearInterval(intervalHandle);
            intervalHandle = null;
        }
    };
})();