<template>
  <div
    ref="scrollContainer"
    class="container"
    tabindex="0"
    @wheel="handleWheel"
    @keydown="handleKeydown"
    @mousedown="handleMouseDown"
  >
    <div class="text">{{ display }}</div>
    <div class="buttons">
      <select v-model="position" class="cata" @change="change">
        <option v-for="cata in list" :key="cata" :value="cata.position">
          {{ cata.text }}
        </option>
      </select>
      <div class="button" @click="openFileDialog">☁</div>
      <div id="button1" style="-webkit-app-region: drag" class="button">┋</div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      selectedFile: '',
      error: '',
      content: '',
      display: '',
      filePath: '',
      config: {
        page: 0,
        size: 40,
        rule: ''
      },
      list: [],
      position: 0
    }
  },
  mounted() {},
  methods: {
    handleMouseDown(event) {
      if (event.button === 1) {
        this.display = ''
      }
    },
    handleKeydown(event) {
      if (event.key === 'd') {
        this.config.page += this.config.size
      } else if (event.key === 's') {
        this.config.page -= this.config.size
      } else if (event.key === 'a') {
        this.display = ''
        return
      } else {
        return
      }
      this.pageChange()
    },
    async handleWheel(event) {
      if (event.deltaY > 0) {
        this.config.page += this.config.size
      } else if (this.config.page > 0) {
        this.config.page -= this.config.size
      } else {
        return
      }
      this.pageChange()
    },
    async pageChange() {
      this.display = this.content.substring(this.config.page, this.config.page + this.config.size)
      await window.api.writeFile({
        filePath: this.filePath + '.config',
        content: JSON.stringify(this.config)
      })
      this.setPosition()
    },
    async openFileDialog() {
      try {
        const result = await window.api.openFileDialog()
        if (result.success) {
          this.selectedFile = result.filePath
          this.content = result.content
          this.filePath = result.filePath
          await this.setConfig(result.filePath + '.config')
        } else {
          this.display = result.message || '选择文件失败'
        }
      } catch (error) {
        this.display = `发生错误：${error.message}`
      }
    },
    async setConfig(configPath) {
      const result = await window.api.readFile(configPath)
      if (result.success) {
        this.config = JSON.parse(result.data)
      } else {
        this.config = {
          page: 0,
          size: 40,
          rule: '第.*章|.*章:'
        }
      }
      this.display = this.content.substring(this.config.page, this.config.page + this.config.size)
      this.findAllMatches()
    },
    findAllMatches() {
      const lines = this.content.split('\n')
      const matches = []
      const regex = new RegExp(this.config.rule, 'g')
      let globalIndex = 0

      lines.forEach((line) => {
        let match
        while ((match = regex.exec(line)) !== null) {
          const globalPosition = globalIndex + match.index
          const text = line.length > 32 ? line.substring(0, 32) + '...' : line
          matches.push({
            position: globalPosition,
            text: text.replaceAll('\r', '')
          })
        }
        globalIndex += line.length + 1
      })
      this.list = matches
      this.setPosition()
    },
    change(event) {
      this.config.page = Number(event.target.value)
      this.display = this.content.substring(this.config.page, this.config.page + this.config.size)
    },
    setPosition() {
      if (this.list.length <= 0) {
        return
      }
      for (const cata of this.list) {
        if (this.config.page < cata.position) {
          break
        }
        this.position = cata.position
      }
    }
  }
}
</script>
<style scoped>
.container {
  outline: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
}
.buttons {
  display: flex;
  gap: 10px;
}
.button {
  padding: 5px 10px 5px 0;
  cursor: pointer;
  background-color: var(--ev-c-black);
  color: var(--ev-c-text-2);
}
.cata {
  padding: 5px 10px 5px 0;
  background-color: var(--ev-c-black);
  color: var(--ev-c-text-2);
  height: 35px;
  width: 20px;
  border: none;
  outline: none;
}
.cata:focus {
  outline: none;
}
</style>
