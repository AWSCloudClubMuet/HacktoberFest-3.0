# Moksh ka issue 8 demo guide

## 30 second introduction

Hamare issue mein chaar kaam hain: ML training code ki problems samajhna, attention ke gradients khud banana aur check karna, fraud detector ki evaluation design karna, aur learning curves ki explanation dena. Attention aur cost calculations humne locally run ki hain. Original training data nahi diya gaya, is liye training accuracy improve hone ka claim nahi kiya.

## Step 1 Training problem

Training loss kam ho raha tha lekin validation accuracy 55% ke qareeb thi. Humne har visible problem ko symptom aur fix ke saath likha. Scaler sirf training data par fit hona chahiye; inputs aur labels saath shuffle hone chahiye; validation mein eval mode hona chahiye; scheduler ka step intended cadence par hona chahiye.

Agar poochein '55% ki asal wajah kya thi?': snippet se ek cause prove nahi hota. Loader construction aur class distribution missing hain. Hum majority baseline, repeated predictions, tiny-data fit aur learning-rate history se hypotheses check karne ka plan dete hain.

## Step 2 Attention

Q ka matlab query, K matching information aur V actual values. Pehle Q aur K se matching scores bante hain. Softmax unko weights mein badalta hai. Weights se V combine hota hai aur output milta hai.

Backward pass batata hai ke output ke loss mein change, Q/K/V ko kis direction mein affect karta hai. Humne dV, dP, dS, dQ aur dK mathematically derive karke NumPy mein likhe. q/k/v chhote variable names hain kyun ke ye problem ki standard mathematical notation hai.

Agar poochein 'derivative sahi kaise pata chala?': har input ko bohat chhota plus/minus change diya, scalar loss ka farq nikala, aur us numerical gradient ko apne analytic gradient se compare kiya. Float64, fixed seed aur explicit tolerances use kiye. Actual errors results/gradient_checks.json mein hain.

## Step 3 Mask aur stability

Causal mask mein har position sirf apne aur pichhle inputs ko dekh sakti hai. Future scores ki probability aur score-gradient zero hoti hai. Is ka matlab poori Q/K/V row ka gradient lazmi zero nahi hota.

Softmax se pehle har row ka maximum minus karte hain taa ke exponentials overflow na karein. Fully masked row ko error dete hain kyun ke uska valid attention distribution defined nahi hota. Large finite negative number daal kar fake uniform weights nahi banate.

Agar poochein 'FlashAttention implement kiya?': nahi. Humne memory benefit explain kiya hai. Hamari NumPy implementation full score/probability matrices banati hai; FlashAttention tiling aur recomputation se full quadratic matrices ko GPU memory mein store karna avoid karta hai.

## Step 4 Fraud evaluation

0.1% fraud ka matlab illustrative 100,000 transactions mein expected 100 frauds. Sab ko normal kehne wala model 99.9% accuracy le sakta hai magar ek bhi fraud nahi pakarta. Is liye precision/recall, alert volume aur monetary cost dekhte hain.

Data ko waqt ke hisaab se split karte hain. Chargeback labels 30-60 din baad aate hain; abhi chargeback na aana confirmed normal hone ka saboot nahi. Sirf us waqt available features aur matured labels use karte hain.

Agar fraud probability p ho, flag karne ki expected cost 5*(1-p), aur pass karne ki 200*p hai. Dono equal rakhne par threshold 5/205, takreeban 2.439%, aata hai. Ye calibrated probabilities aur stated cost assumptions ka result hai, trained detector ka measured threshold nahi.

## Step 5 Learning curves

A ka small gap aur low scores underfitting ya optimization/data problems suggest kar sakte hain. B ka high train aur lower validation overfitting suggest karta hai. C mein validation higher hona dropout/augmentation, easier split ya leakage ki wajah se ho sakta hai. D ka persistent gap distribution shift ya different label quality ki wajah se ho sakta hai. Frozen model aur independent label audit se in explanations ko distinguish karne ka experiment propose kiya hai.

## Live verification

Issue folder mein:

```powershell
..\.venv\Scripts\python.exe verify.py
```

Expected: 22 tests, zero failures/errors, gradient_checks_passed true. Last digits of numerical errors platform ke hisaab se thore badal sakte hain; tolerances ke andar rehna chahiye.

## Jo claims nahi karne

- Original dataset par training accuracy improve hui: humne woh experiment nahi kiya.
- Real fraud detector deploy kiya: nahi, evaluation design aur arithmetic di hai.
- FlashAttention GPU kernel banaya: nahi, explanation di hai.
- AI use nahi hua: coding-assistant support ko honestly explain karo aur organizer policy follow karo.

Kartik issue 13 aur Laksh issue 9 own karte hain. Unke implementation/tests ka status unki actual handoff aur commits se verify hoga; is issue ke tests unki solutions test nahi karte.
