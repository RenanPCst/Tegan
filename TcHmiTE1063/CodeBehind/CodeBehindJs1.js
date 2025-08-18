// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.

/// <reference path="./../../Git/Packages/Beckhoff.TwinCAT.HMI.Framework.12.762.44/runtimes/native1.12-tchmi/TcHmi.d.ts" />

(function (/** @type {globalThis.TcHmi} */ TcHmi) {

    // ============================================
    // IO-Link helpers (sem watchers)
    // ============================================

    /**
     * Interpreta o "IO-Link Device Status" (TxPDO State).
     * @param {number} value USINT recebido do PLC
     * @returns {string}
     */
    function interpretIOLinkState(value) {
        switch (Number(value)) {
            case 0: return 'Unknown / Disabled';
            case 1: return 'SIO mode';
            case 2: return 'IO-Link enabled, no device';
            case 3: return 'IO-Link OK';
            case 4: return 'Pre-operational';
            case 8: return 'Comm error';
            case 16: return 'Overcurrent';
            case 164: return 'Port active, no device (0xA4)';
            default: return 'Unknown (' + value + ')';
        }
    }

    /**
     * Interpreta o "IO-Link Port Qualifier" (TxPDO Qualifier).
     * Bits comuns em masters IFM (pode variar por FW):
     *  bit7 (0x80): IO-Link ON / SIO OFF
     *  bit6 (0x40): Communication OK
     *  bit5 (0x20): Error present
     *  bit4 (0x10): Process value valid
     *  bit3 (0x08): Port active / base
     *  bits0..2    : modo/extra
     * @param {number} value USINT recebido do PLC
     * @returns {string}
     */
    function interpretPortQualifier(value) {
        value = Number(value);
        var flags = [];
        if (value & 0x80) flags.push('IO-Link ON'); else flags.push('SIO/Port OFF');
        if (value & 0x40) flags.push('Comm OK');
        if (value & 0x20) flags.push('Error');
        if (value & 0x10) flags.push('PV valid');
        if (value & 0x08) flags.push('Port active');

        if (value === 168) return 'Connected (IO-Link); ' + flags.join(', ') + ' [0xA8]';
        if (value === 8) return 'No device / Not IO-Link; ' + flags.join(', ') + ' [0x08]';

        return (flags.length ? flags.join(', ') : 'Unknown') +
               ' [0x' + value.toString(16).toUpperCase().padStart(2, '0') + ']';
    }

    /** Regra prática: STATE OK (verde) quando comunicação estabelecida. */
    function isStateOk(value) {
        return Number(value) === 3;
    }

    /**
     * Regra prática: QUALIFIER OK (verde) quando não for 0 ou 8.
     * (no seu cenário: 8 = porta vazia; 168 = conectado)
     */
    function isQualifierOk(value) {
        value = Number(value);
        if (value === 0 || value === 8) return false;
        return true;
    }

    /** Seta texto em uma TcHmiTextBox (com fallback DOM). */
    function setTextboxText(controlId, text) {
        try {
            var ctrl = (TcHmi && TcHmi.Controls && TcHmi.Controls.get) ? TcHmi.Controls.get(controlId) : null;
            if (ctrl && typeof ctrl.setText === 'function') {
                ctrl.setText(String(text));
            } else {
                var el = document.getElementById(controlId);
                if (el) el.textContent = String(text);
            }
        } catch (e) { /* silent */ }
    }

    /** Escreve um booleano em um símbolo do PLC. */
    function setPlcBool(symbolExpr, boolVal) {
        try {
            TcHmi.Symbol.writeEx2(symbolExpr, Boolean(boolVal), function (data) {
                if (data.error !== TcHmi.Errors.NONE) {
                    console.error('Erro ao escrever em ' + symbolExpr, data);
                }
            });
        } catch (e) {
            console.error('Exceção ao escrever em ' + symbolExpr, e);
        }
    }

    /**
     * Atualiza TextBox de STATE e escreve bStateIOLink[channel] no PLC.
     * Use esta função no evento Custom (Value changed) do símbolo nStateIOLink[channel].
     */
    function updateStateUI(channel, rawValue) {
        var val = Number(rawValue);
        setTextboxText('TcHmiTextBox_StateIOLinkCh' + channel, interpretIOLinkState(val));
        var ok = isStateOk(val);
        // escreve em bStateIOLink[channel]
        var sym = '%s%PLC1.GVL_IO.stAL1333info.bStateIOLink[' + channel + ']%/s%';
        setPlcBool(sym, ok);
    }

    /**
     * Atualiza TextBox de QUALIFIER e escreve bQualifierIOLink[channel] no PLC.
     * Use esta função no evento Custom (Value changed) do símbolo nQualifierIOLink[channel].
     */
    function updateQualifierUI(channel, rawValue) {
        var val = Number(rawValue);
        setTextboxText('TcHmiTextBox_QualifierIOLinkCh' + channel, interpretPortQualifier(val));
        var ok = isQualifierOk(val);
        // escreve em bQualifierIOLink[channel]
        var sym = '%s%PLC1.GVL_IO.stAL1333info.bQualifierIOLink[' + channel + ']%/s%';
        setPlcBool(sym, ok);
    }

    // Expõe helpers para uso direto nos Custom Events
    if (typeof window !== 'undefined') {
        window.interpretIOLinkState = interpretIOLinkState;
        window.interpretPortQualifier = interpretPortQualifier;
        window.isStateOk = isStateOk;
        window.isQualifierOk = isQualifierOk;
        window.setTextboxText = setTextboxText;
        window.setPlcBool = setPlcBool;
        window.updateStateUI = updateStateUI;
        window.updateQualifierUI = updateQualifierUI;
    }

    // ============================================
    // Código existente do seu app (User Management)
    // ============================================

    var destroyOnInitialized = TcHmi.EventProvider.register('onInitialized', function (e, data) {
        e.destroy();
        init();
    });

    // Main initialization function
    function init() {
        refreshCurrentUserInfo();
        refreshUserList();
        refreshGroupList();
        bindButtons();
        populateGroupComboboxes();
        // Sem watchers: IO-Link será atualizado via Custom Events por variável
    }

    // Load currently logged-in user info and update UI
    function refreshCurrentUserInfo() {
        TcHmi.Symbol.readEx2('%i%UserManagement::CurrentUser::Name%', function (data) {
            if (data.error === TcHmi.Errors.NONE) {
                TcHmi.Controls.get('TcHmiTextblock_CurrentUserName').setText(data.value);
            }
        });

        TcHmi.Symbol.readEx2('%i%UserManagement::CurrentUser::Groups%', function (data) {
            if (data.error === TcHmi.Errors.NONE) {
                TcHmi.Controls.get('TcHmiTextblock_CurrentUserGroup').setText(data.value.join(', '));
            }
        });

        TcHmi.Symbol.readEx2('%i%UserManagement::CurrentUser::AutoLogout%', function (data) {
            if (data.error === TcHmi.Errors.NONE) {
                TcHmi.Controls.get('TcHmiTextblock_CurrentAutoLogout').setText(data.value);
            }
        });

        TcHmi.Controls.get('TcHmiTextblock_LastAppearance').setText('N/A'); // Placeholder
    }

    // Check if the password meet the parameters
    function isValidPassword(pw) {
        if (pw.length < 5 || pw.length > 8) return false;
        if (!/[a-z]/.test(pw)) return false;
        if (!/[A-Z]/.test(pw)) return false;
        if (!/[0-9]/.test(pw)) return false;
        if (!/[^a-zA-Z0-9]/.test(pw)) return false;
        return true;
    }

    // Load the current user groups and populate the comboboxes
    function populateGroupComboboxes() {
        listGroups().then(function (groups) {
            var groupArray = Object.keys(groups);
            var comboNew = TcHmi.Controls.get('TcHmiCombobox_NewUserGroup');
            var comboEdit = TcHmi.Controls.get('TcHmiCombobox_EditCurrentUserGroup');

            comboNew.setItems(groupArray);
            comboEdit.setItems(groupArray);
        });
    }

    // Load user list and display in DataGrid
    function refreshUserList() {
        listUsers().then(function (users) {
            var userTable = [];
            for (var i = 0; i < users.length; i++) {
                userTable.push({ 'User Name': users[i] });
            }
            TcHmi.Controls.get('TcHmiDatagrid_UserLists').setData(userTable);
        }).catch(function (err) {
            console.error('Failed to load users:', err);
        });
    }

    // Load user groups and display in DataGrid
    function refreshGroupList() {
        listGroups().then(function (groups) {
            var groupTable = [];
            for (var key in groups) {
                if (groups.hasOwnProperty(key)) {
                    groupTable.push({ 'Group Name': key });
                }
            }
            TcHmi.Controls.get('TcHmiDatagrid_GroupLists').setData(groupTable);
        }).catch(function (err) {
            console.error('Failed to load groups:', err);
        });
    }

    // Bind button events to their corresponding handlers
    function bindButtons() {
        // Add new user
        TcHmi.Controls.get('TcHmiButton_NewUserAdd').onPressed.addListener(function () {
            var username = TcHmi.Controls.get('TcHmiTextbox_NewUserName').getText();
            var password = TcHmi.Controls.get('TcHmiPasswordInput_NewUserPasswdUpdate').getText();
            var group = parseInt(TcHmi.Controls.get('TcHmiCombobox_NewUserGroup').getSelectedIndex(), 10);
            var timeout = parseInt(TcHmi.Controls.get('TcHmiNumericInput_NewUserTimeOut').getValue(), 10);

            AddUserEx(username, password, timeout, group).then(function () {
                alert('User successfully created!');
                refreshUserList();
            }).catch(function (err) {
                alert('Error creating user: ' + err);
            });
        });

        // Clear new user input fields
        TcHmi.Controls.get('TcHmiButton_NewUserClear').onPressed.addListener(function () {
            TcHmi.Controls.get('TcHmiTextbox_NewUserName').setText('');
            TcHmi.Controls.get('TcHmiPasswordInput_NewUserPasswdUpdate').setText('');
            TcHmi.Controls.get('TcHmiNumericInput_NewUserTimeOut').setValue(0);
            TcHmi.Controls.get('TcHmiCombobox_NewUserGroup').setSelectedIndex(0);
        });

        // Update selected user
        TcHmi.Controls.get('TcHmiButton_UpdateUser').onPressed.addListener(function () {
            var username = TcHmi.Controls.get('TcHmiTextbox_EditCurrentUserName').getText();
            var group = parseInt(TcHmi.Controls.get('TcHmiCombobox_EditCurrentUserGroup').getSelectedIndex(), 10);
            var timeout = parseInt(TcHmi.Controls.get('TcHmiNumericInput_EditCurrentTimeOut').getValue(), 10);
            var password = ''; // leave blank to keep the current password

            UpdateUser(username, username, password, timeout, group).then(function () {
                alert('User successfully updated!');
                refreshUserList();
            }).catch(function (err) {
                alert('Error updating user: ' + err);
            });
        });

        // Delete selected user
        TcHmi.Controls.get('TcHmiButton_DeleteUser').onPressed.addListener(function () {
            var username = TcHmi.Controls.get('TcHmiTextbox_EditCurrentUserName').getText();
            if (!username) return;

            if (confirm('Do you really want to delete user "' + username + '"?')) {
                RemoveUser(username).then(function () {
                    alert('User successfully deleted.');
                    refreshUserList();
                }).catch(function (err) {
                    alert('Error deleting user: ' + err);
                });
            }
        });

        // Change current user password
        TcHmi.Controls.get('TcHmiButton_ChangePasswd').onPressed.addListener(function () {
            var oldPass = TcHmi.Controls.get('TcHmiPasswordInput_Passwd').getText();
            var newPass = TcHmi.Controls.get('TcHmiPasswordInput_PasswdUpdate').getText();

            TcHmi.Server.UserManagement.changePassword(oldPass, newPass, function (data) {
                if (data.error === TcHmi.Errors.NONE) {
                    alert('Password changed successfully!');
                } else {
                    alert('Error changing password.');
                }
            });
        });

        // Refresh user list
        TcHmi.Controls.get('TcHmiButton_ListUsers').onPressed.addListener(function () {
            refreshUserList();
        });

        // Refresh group list
        TcHmi.Controls.get('TcHmiButton_ListGroups').onPressed.addListener(function () {
            refreshGroupList();
        });

        // Logout current user
        TcHmi.Controls.get('TcHmiButton_Logout').onPressed.addListener(function () {
            TcHmi.Server.UserManagement.logout({}, function (data) {
                if (data.error === TcHmi.Errors.NONE) {
                    alert('Logout successful.');
                }
            });
        });

        // Show login dialog
        TcHmi.Controls.get('TcHmiButton_Login').onPressed.addListener(function () {
            TcHmi.Server.UserManagement.showLoginDialog();
        });
    }

})(TcHmi);
