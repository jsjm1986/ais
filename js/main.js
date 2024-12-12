class AIChat {
    constructor() {
        this.agents = [];
        this.isConversationActive = false;
        this.userParticipation = true;
        this.conversationHistory = [];
    }

    initializeAPI(apiKey) {
        this.api = new DeepseekAPI(apiKey);
    }

    initializeAgents() {
        this.agents.push(new AIAgent('Alice', '幽默作家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'));
        this.agents.push(new AIAgent('Bob', '严肃哲学家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'));
        this.agents.push(new AIAgent('Carol', '热情艺术家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol'));
        
        this.initializeRelationships();
        this.renderAgents();
    }

    initializeRelationships() {
        this.agents.forEach(agent => {
            this.agents.forEach(otherAgent => {
                if (agent !== otherAgent) {
                    agent.relationships.set(otherAgent.name, 50 + Math.random() * 20);
                }
            });
        });
    }

    renderAgents() {
        const container = document.querySelector('.agents-container');
        container.innerHTML = '';
        
        this.agents.forEach(agent => {
            const agentElement = document.createElement('div');
            agentElement.id = `agent-${agent.name}`;
            agentElement.className = 'agent';
            agentElement.innerHTML = `
                <button class="edit-character-btn" onclick="window.aiChat.editAgent('${agent.name}')">
                    编辑
                </button>
                <img src="${agent.avatar}" class="avatar">
                <img src="${AIAgent.defaultEmotions['neutral']}" class="emotion">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-role">${agent.role}</div>
                <div class="agent-actions">
                    ${this.generateActionButtons(agent)}
                </div>
            `;
            container.appendChild(agentElement);
        });
    }

    generateActionButtons(agent) {
        return Object.entries(AIAgent.actions)
            .map(([action, label]) => `
                <button class="action-btn" 
                        onclick="window.aiChat.handleUserAction('${action}', '${agent.name}')">
                    ${label}
                </button>
            `).join('');
    }

    async handleUserAction(action, targetAgentName) {
        const targetAgent = this.agents.find(a => a.name === targetAgentName);
        if (!targetAgent) return;

        this.displayAction('用户', action, targetAgent.name);

        const possibleResponses = targetAgent.getPossibleResponses(action, {name: '用户'});
        const response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
        
        setTimeout(() => {
            targetAgent.performAction(response);
            this.displayAction(targetAgent.name, response, '用户');
        }, 1000);
    }

    displayAction(fromName, action, toName) {
        const chatContainer = document.querySelector('.chat-messages');
        const actionElement = document.createElement('div');
        actionElement.className = 'action-message';
        actionElement.innerHTML = `
            <span class="action-text">
                ${fromName} ${AIAgent.actions[action]} ${toName ? `向 ${toName}` : ''}
            </span>
        `;
        chatContainer.appendChild(actionElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async startConversation() {
        this.isConversationActive = true;
        while (this.isConversationActive) {
            for (const agent of this.agents) {
                await this.generateAndDisplayResponse(agent);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    async generateAndDisplayResponse(agent) {
        const context = this.getConversationContext();
        const prompt = this.createPromptForAgent(agent);
        const response = await this.api.generateResponse(
            prompt,
            context
        );
        
        this.conversationHistory.push({
            isUser: false,
            agent: agent.name,
            content: response,
            timestamp: new Date().getTime()
        });
        
        if (Math.random() > 0.7) {
            const emotion = this.getRandomEmotion();
            agent.setEmotion(emotion);
        }
        
        this.displayMessage(agent, response);
    }

    displayMessage(agent, message) {
        const chatContainer = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <img src="${agent.avatar}" class="avatar">
            <div class="message-content">
                <span class="agent-name">${agent.name}</span>
                <p>${message}</p>
            </div>
        `;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async testEmotions() {
        const emotions = Object.keys(AIAgent.emotions);
        const testAgent = this.agents[0];
        
        for (const emotion of emotions) {
            console.log(`测试表情: ${emotion}`);
            await testAgent.setEmotion(emotion);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    getConversationContext() {
        return this.conversationHistory.slice(-10).map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    createPromptForAgent(agent) {
        const basePrompt = agent.generatePrompt();
        const recentMessages = this.getRecentMessages(3);
        
        return `${basePrompt}

                当前对话场景：
                ${recentMessages.map(msg => 
                    `${msg.agent || '用户'}: ${msg.content}`
                ).join('\n')}
                
                请根据当前场景和你的角色特点，给出一个简短的回应。`;
    }

    getRecentMessages(count = 3) {
        return this.conversationHistory
            .slice(-count)
            .map(msg => ({
                agent: msg.agent,
                content: msg.content,
                timestamp: msg.timestamp
            }));
    }

    getRandomEmotion() {
        const emotions = Object.keys(AIAgent.emotions);
        return emotions[Math.floor(Math.random() * emotions.length)];
    }

    addUserMessage(message) {
        this.conversationHistory.push({
            isUser: true,
            content: message,
            timestamp: new Date().getTime()
        });
    }

    editAgent(agentName) {
        const agent = this.agents.find(a => a.name === agentName);
        if (!agent) return;

        const modal = document.getElementById('editProfileModal');
        const form = document.getElementById('profileEditForm');
        
        // 填充表单
        document.getElementById('editName').value = agent.name;
        document.getElementById('editRole').value = agent.profile.role;
        document.getElementById('editBackground').value = agent.profile.background;
        document.getElementById('editTraits').value = agent.profile.traits.join(', ');
        document.getElementById('editInterests').value = agent.profile.interests.join(', ');
        document.getElementById('editSpeakingStyle').value = agent.profile.speakingStyle;
        
        // 设置性格滑块
        document.getElementById('editHumor').value = agent.profile.personality.humor;
        document.getElementById('editCreativity').value = agent.profile.personality.creativity;
        document.getElementById('editFriendliness').value = agent.profile.personality.friendliness;
        document.getElementById('editSeriousness').value = agent.profile.personality.seriousness;
        
        // 更新滑块值显示
        document.querySelectorAll('.slider-group input[type="range"]').forEach(slider => {
            const valueDisplay = slider.nextElementSibling;
            valueDisplay.textContent = slider.value;
            slider.oninput = () => valueDisplay.textContent = slider.value;
        });

        // 显示模态框
        modal.style.display = 'flex';

        // 处理表单提交
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const newName = document.getElementById('editName').value.trim();
            if (!this.validateProfileForm(newName, agent.name)) {
                return;
            }

            const newProfile = {
                name: newName,
                role: document.getElementById('editRole').value,
                background: document.getElementById('editBackground').value,
                traits: document.getElementById('editTraits').value.split(',').map(s => s.trim()),
                interests: document.getElementById('editInterests').value.split(',').map(s => s.trim()),
                speakingStyle: document.getElementById('editSpeakingStyle').value,
                personality: {
                    humor: parseInt(document.getElementById('editHumor').value),
                    creativity: parseInt(document.getElementById('editCreativity').value),
                    friendliness: parseInt(document.getElementById('editFriendliness').value),
                    seriousness: parseInt(document.getElementById('editSeriousness').value)
                }
            };

            // 更新其他角色的关系映射
            if (newName !== agent.name) {
                this.agents.forEach(otherAgent => {
                    if (otherAgent !== agent) {
                        const relationship = otherAgent.relationships.get(agent.name);
                        if (relationship !== undefined) {
                            otherAgent.relationships.delete(agent.name);
                            otherAgent.relationships.set(newName, relationship);
                        }
                    }
                });
            }

            agent.updateProfile(newProfile);
            this.renderAgents();
            modal.style.display = 'none';

            // 更新对话历史中的名称
            this.conversationHistory = this.conversationHistory.map(msg => ({
                ...msg,
                agent: msg.agent === agent.name ? newName : msg.agent
            }));
        };

        // 处理取消按钮
        document.querySelector('.cancel-btn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    validateProfileForm(newName, currentName) {
        if (!newName || newName.trim() === '') {
            alert('角色名称不能为空');
            return false;
        }

        if (newName !== currentName && this.agents.some(a => a.name === newName)) {
            alert('该角色名称已存在，请使用其他名称');
            return false;
        }

        return true;
    }
}

window.aiChat = new AIChat();

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const submitButton = document.getElementById('submitApiKey');
    const errorMessage = document.getElementById('apiKeyError');
    const gameContainer = document.querySelector('.game-container');

    async function validateApiKey(apiKey) {
        try {
            const api = new DeepseekAPI(apiKey);
            await api.generateResponse('测试消息', []);
            return true;
        } catch (error) {
            console.error('API密钥验证失败:', error);
            return false;
        }
    }

    submitButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            errorMessage.textContent = '请输入API密钥';
            errorMessage.style.display = 'block';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = '验证中...';

        try {
            const isValid = await validateApiKey(apiKey);
            
            if (isValid) {
                window.aiChat.initializeAPI(apiKey);
                
                apiKeyModal.style.display = 'none';
                gameContainer.classList.add('active');
                
                window.aiChat.initializeAgents();
                
                document.getElementById('startConversation').addEventListener('click', () => {
                    window.aiChat.startConversation();
                });
                
                document.getElementById('resetConversation').addEventListener('click', () => {
                    window.aiChat.isConversationActive = false;
                    document.querySelector('.chat-messages').innerHTML = '';
                });
                
                const testButton = document.createElement('button');
                testButton.textContent = '测试表情';
                testButton.onclick = () => window.aiChat.testEmotions();
                document.querySelector('.controls').appendChild(testButton);
            } else {
                errorMessage.textContent = 'API密钥无效，请重试';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.textContent = '验证过程出错，请重试';
            errorMessage.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '确认';
        }
    });

    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitButton.click();
        }
    });

    const savedApiKey = localStorage.getItem('deepseekApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
}); 