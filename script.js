/*jslint browser */
(function () {
    "use strict";

    
    const FORM_ID = "BDutpn4fT4g";
    const ENDPOINT = "https://formcarry.com/s/" + FORM_ID;
    const STORAGE_KEY = "feedbackFormData";
    const FORM_HASH = "#feedback";

    const overlay = document.getElementById("overlay");
    const openBtn = document.getElementById("open-form");
    const closeBtn = document.getElementById("close-form");
    const form = document.getElementById("feedback-form");
    const submitBtn = document.getElementById("submit");
    const statusEl = document.getElementById("status");
    const fields = ["fio", "email", "phone", "org", "message"];

    function setStatus(text, type) {
        statusEl.textContent = text;
        statusEl.className = "status" + (
            type
            ? " " + type
            : ""
        );
    }

    // ---------- LocalStorage ----------
    function saveData() {
        const data = {};
        fields.forEach(function (id) {
            data[id] = document.getElementById(id).value;
        });
        data.agree = document.getElementById("agree").checked;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (ignore) {
            // хранилище недоступно - ничего не делаем
        }
    }

    function restoreData() {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (ignore) {
            data = null;
        }
        if (!data) {
            return;
        }
        fields.forEach(function (id) {
            document.getElementById(id).value = data[id] || "";
        });
        document.getElementById("agree").checked = Boolean(data.agree);
    }

    function clearData() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (ignore) {
            // хранилище недоступно - ничего не делаем
        }
        form.reset();
    }

    // ---------- Попап и History API ----------
    function showPopup() {
        overlay.hidden = false;
        document.getElementById("fio").focus();
    }

    function hidePopup() {
        overlay.hidden = true;
        setStatus("");
    }

    function openForm() {
        if (!(history.state && history.state.popup)) {
            history.pushState({popup: true}, "", FORM_HASH);
        }
        showPopup();
    }

    function closeForm() {
        if (history.state && history.state.popup) {
            history.back(); // popstate закроет попап
        } else {
            hidePopup();
        }
    }

    window.addEventListener("popstate", function () {
        if (location.hash === FORM_HASH) {
            showPopup();
        } else {
            hidePopup();
        }
    });

    openBtn.addEventListener("click", openForm);
    closeBtn.addEventListener("click", closeForm);
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closeForm();
        }
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !overlay.hidden) {
            closeForm();
        }
    });

    // ---------- Отправка ----------
    const fioInput = document.getElementById("fio");
    const phoneInput = document.getElementById("phone");
    const orgInput = document.getElementById("org");
    const messageInput = document.getElementById("message");
    const agreeInput = document.getElementById("agree");

    function checkField(input, isValid, text) {
        input.setCustomValidity(
            isValid
            ? ""
            : text
        );
    }

    function validateFields() {
        const fio = fioInput.value.trim();
        const phoneDigits = phoneInput.value.replace(/\D/g, "");

        checkField(
            fioInput,
            fio !== "" && !(/\d/).test(fio),
            "Введите ФИО без цифр"
        );
        checkField(
            phoneInput,
            (/^[0-9+()\s\-]+$/).test(phoneInput.value) &&
                    phoneDigits.length >= 10,
            "Введите телефон: только цифры, не менее 10"
        );
        checkField(
            orgInput,
            orgInput.value.trim() !== "",
            "Заполните поле «Организация»"
        );
        checkField(
            messageInput,
            messageInput.value.trim() !== "",
            "Заполните поле «Сообщение»"
        );
        checkField(
            agreeInput,
            agreeInput.checked,
            "Необходимо согласие с политикой обработки данных"
        );
    }

    // Запрет ввода цифр в ФИО и букв в телефоне
    fioInput.addEventListener("input", function () {
        fioInput.value = fioInput.value.replace(/\d/g, "");
    });
    phoneInput.addEventListener("input", function () {
        phoneInput.value = phoneInput.value.replace(/[^0-9+()\s\-]/g, "");
    });

    form.addEventListener("input", saveData);
    form.addEventListener("change", saveData);
    form.addEventListener("input", validateFields);
    form.addEventListener("change", validateFields);
    validateFields();

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        validateFields();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        submitBtn.disabled = true;
        setStatus("Отправка...");

        fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: document.getElementById("fio").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                organization: document.getElementById("org").value,
                message: document.getElementById("message").value,
                agree: document.getElementById("agree").checked
            })
        }).then(function (response) {
            return response.json().then(function (result) {
                if (response.ok && result.code === 200) {
                    clearData();
                    setStatus("Спасибо! Сообщение успешно отправлено.", "ok");
                } else {
                    setStatus(
                        "Ошибка отправки: " + (result.message || response.status),
                        "error"
                    );
                }
            });
        }).catch(function () {
            setStatus("Ошибка сети. Попробуйте отправить позже.", "error");
        }).finally(function () {
            submitBtn.disabled = false;
        });
    });

    // ---------- Инициализация ----------
    restoreData();
    validateFields();
    if (location.hash === FORM_HASH) {
        history.replaceState({popup: true}, "", FORM_HASH);
        showPopup();
    }
}());
