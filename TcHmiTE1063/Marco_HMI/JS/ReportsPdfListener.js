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

    async function buildLinearData() {
        const linearReport = await readSymbol('PLC1.GVL_Reports.stLinearReport');

        return linearReport || {};
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

            if (Number(reportType) === 1) {
                if (typeof genPumpCalibrationReport !== 'function') {
                    throw new Error('Pump calibration PDF function was not found.');
                }

                const header = await buildPumpCalibHeader();
                const values = await readSymbol('PLC1.GVL_Reports.aPumpCalibValues');
                const reportName = 'Pump Calibration Report - ID ' + String(header.CalibrationNo ?? '');

                console.log('Pump Calibration header:', header);
                console.log('Pump Calibration values:', values);

                genPumpCalibrationReport(values || [], header, reportName);
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