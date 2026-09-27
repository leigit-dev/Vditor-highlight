/* custom-vditor-sv.js */
(function () {
    /* ==========================================
       核心：Markdown 文本 → 带颜色的 HTML
       ========================================== */
    /* ==========================================
       核心：Markdown 文本 → 带颜色的 HTML
       ========================================== */
    function highlightMarkdown(text) {
        // 1. 转义 HTML
        let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 2. 先把多行代码块提取出来，用占位符替换
        //    （\u0000 是控制字符，正常内容里不会出现，用作占位符很安全）
        const codeBlocks = [];
        html = html.replace(/(```[a-zA-Z]*\n?)([\s\S]*?)(\n?```)/g, function (match, open, codeContent, close) {
            const placeholder = '\u0000CODEBLOCK' + codeBlocks.length + '\u0000';
            codeBlocks.push({ open: open, content: codeContent, close: close });
            return placeholder;
        });

        // 3. 再把行内代码提取出来（防止 `[x](y)` 被误判为链接）
        const inlineCodes = [];
        html = html.replace(/(`[^`\n]+`)/g, function (match) {
            const placeholder = '\u0000INLINECODE' + inlineCodes.length + '\u0000';
            inlineCodes.push(match);
            return placeholder;
        });

        // 4. 标题
        html = html.replace(/^(#{1,6}\s+.*)$/gm, '<span class="token-heading">$1</span>');

        // 5. 删除线
        html = html.replace(/(~~(?!\s).(?!\s)*?~~)/g, '<span class="token-strike">$1</span>');

        // 6. 粗体 / 斜体
        html = html.replace(/(\*\*(?!\s).*?(?<!\s)\*\*)|(\*(?!\s).*?(?<!\s)\*)/g, function (match, bold, italic) {
            if (bold) return '<span class="token-bold">' + bold + '</span>';
            if (italic) return '<span class="token-italic">' + italic + '</span>';
            return match;
        });

        // 7. 链接（此时 html 里已经没有代码块和行内代码的内容，lambda 不会再被误匹配）
        html = html.replace(/(\[.*?\]\(.*?\))/g, '<span class="token-link">$1</span>');

        // 8. 列表
        html = html.replace(/^(\s*[-\*\+]\s+|\s*\d+\.\s+)/gm, '<span class="token-list">$1</span>');

        // 9. 引用（&gt; 是 > 转义后的样子）
        html = html.replace(/^(&gt;\s+.*)$/gm, '<span class="token-quote">$1</span>');

        // 10. 分割线
        html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<span class="token-hr">$1</span>');

        // 11. 还原行内代码
        html = html.replace(/\u0000INLINECODE(\d+)\u0000/g, function (match, index) {
            return '<span class="token-code-inline">' + inlineCodes[parseInt(index, 10)] + '</span>';
        });

        // 12. 还原代码块
        html = html.replace(/\u0000CODEBLOCK(\d+)\u0000/g, function (match, index) {
            const block = codeBlocks[parseInt(index, 10)];
            return block.open + '<span class="token-code-block">' + block.content + '</span>' + block.close;
        });

        return html + '\n';
    }

    /* ==========================================
       清理高亮包装层
       ========================================== */
    function cleanupHighlightLayer() {
        var container = document.querySelector('.vditor-sv-container');
        if (container) {
            var textarea = container.querySelector('.vditor-sv');
            if (textarea) {
                textarea.style.cssText = '';
                container.parentNode.insertBefore(textarea, container);
            }
            container.remove();
        }
    }

    /* ==========================================
       单次初始化 SV 高亮
       ========================================== */
    function initSVHighlight(vditorInstance) {
        var currentMode = vditorInstance && vditorInstance.getCurrentMode
            ? vditorInstance.getCurrentMode()
            : 'sv';

        if (currentMode !== 'sv') {
            cleanupHighlightLayer();
            return;
        }

        const svTextarea = document.querySelector('.vditor-sv');
        if (!svTextarea || svTextarea.parentNode.classList.contains('vditor-sv-container')) {
            return;
        }

        const container = document.createElement('div');
        container.className = 'vditor-sv-container';
        svTextarea.parentNode.insertBefore(container, svTextarea);
        container.appendChild(svTextarea);

        const pre = document.createElement('pre');
        pre.className = 'vditor-sv-highlight';
        const code = document.createElement('code');
        pre.appendChild(code);
        container.insertBefore(pre, svTextarea);

        function updateHighlight() {
            code.innerHTML = highlightMarkdown(svTextarea.value);
        }
        function syncScroll() {
            pre.scrollTop = svTextarea.scrollTop;
            pre.scrollLeft = svTextarea.scrollLeft;
        }

        svTextarea.addEventListener('input', updateHighlight);
        svTextarea.addEventListener('scroll', syncScroll);

        updateHighlight();
        syncScroll();

        svTextarea.updateHighlight = updateHighlight;
    }

    /* ==========================================
       ✅ 对外暴露：手动刷新一次高亮
       （可用于：Vditor setValue / undo / redo / 上传后等）
       ========================================== */
    window.refreshVditorSVHighlight = function () {
        var svTextarea = document.querySelector('.vditor-sv');
        if (svTextarea && svTextarea.updateHighlight) {
            svTextarea.updateHighlight();
        }
    };

    /* ==========================================
       ✅ 对外暴露：一站式启用 SV 高亮
       @param {Object} vditorInstance - Vditor 实例
       @param {Object} [options] - 可选配置
       @param {number} [options.autoRefresh] - 自动刷新间隔(ms)，默认 0 关闭
       ========================================== */
    window.enableVditorSVHighlight = function (vditorInstance, options) {
        options = options || {};
        var autoRefresh = options.autoRefresh || 0;

        if (!vditorInstance) {
            console.warn('enableVditorSVHighlight: 未传入 Vditor 实例');
            return;
        }

        // 1. 首次初始化
        initSVHighlight(vditorInstance);

        // 2. 监听模式切换，自动清理 / 重建
        var editorTarget = vditorInstance.element;
        if (editorTarget && window.MutationObserver) {
            if (editorTarget.__svHighlightObserver__) {
                editorTarget.__svHighlightObserver__.disconnect();
            }
            var observer = new MutationObserver(function () {
                initSVHighlight(vditorInstance);
            });
            observer.observe(editorTarget, { childList: true, subtree: true });
            editorTarget.__svHighlightObserver__ = observer;
        }

        // 3. 可选：自动定时刷新
        //    用于捕获通过 Vditor API 修改内容（setValue/undo/redo/上传图片）而不触发 input 事件的场景
        if (autoRefresh > 0) {
            if (editorTarget && editorTarget.__svHighlightInterval__) {
                clearInterval(editorTarget.__svHighlightInterval__);
            }
            var intervalId = setInterval(function () {
                window.refreshVditorSVHighlight();
            }, autoRefresh);
            if (editorTarget) {
                editorTarget.__svHighlightInterval__ = intervalId;
            }
        }

        console.log('✅ Vditor SV 高亮已启用' + (autoRefresh > 0 ? '（自动刷新 ' + autoRefresh + 'ms）' : ''));
    };

    /* 兼容旧调用名（可选保留） */
    window.initSVHighlight = initSVHighlight;
})();