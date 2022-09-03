// const { useWindowScroll } = require("@mantine/hooks");

const setButton = document.getElementById('switch')
const setButtonText = document.getElementById('button_text')

setButton.addEventListener('click', (event, data) => {
  // const token = tokenInput.value
  window.electronAPI.setSwitch(true)
});

window.electronAPI.onUpdateSwitch((_event, value) => {
  if (value) {
    setButton.style.background = "green"
    setButtonText.innerText = 'BRACKETS ON'
  }
  else {
    setButton.style.background = "red"
    setButtonText.innerText = 'BRACKETS OFF'
  }
})

