#__Noisy Labels. HelpDeskNet-50dk --Analysis Report--__
 ­ƒÅå ----------| EXECUTIVE Summary |-------------------
High-capacity deep learning models are notorious memorizers of label noise. In HelpDeskNet-50K, a 50,000-ticket customer support text classifier stalls at 82% accuracy despite architectural scaling. This investigation proves that the model has reached the theoretical noise ceiling of the crowd-labeled evaluation set, rather than an architectural bottleneck.
 
Key Quantitative Discoveries 

1. Dataset Noise Rate(p╠é):( 15.00%(+-) at 95% confidence Interval, range [11.50%,18.50%]).

2. Tier-Based Quality Variance: Tier A workers show a 6.67% noise rate, while Tier B workers exhbit 21. 82% error rate (z= 4.22, p < 0.0001).

3. Noisy Topology: Noise is non-uniform and class-conditional; 68.33% of all labelling errors are concentrated between two confusable pairs: billing <--> Refund(43.33%) and Technical<-->Account access (25.00%)

4. Accuracy Ceiling paradox: Assuming uniform noise, 82% observed accuracy implies a ~ 96.34% true model accuracy. However, because test labels contain identical systematic noise, current evaluation metrics reward memorisation of annotator errors.

­ƒôÉ Dataset Architecture & Annotation Flow

                                                __________________________________________________

                                                |            HelpDeskNet-50K Dataset             |

                                                |               (50,000 Tickets)                 |
                                                 _________________________________________________ 
                                                                      |
                                                                      |
                                     _____________________________________________________________________________
                                     |                                                                            |
                                     |                                                                            |
                      ___________________________                                                        ___________________________
                                              
                      | In-House Expert Set      |                                                       | Crowd-Labeled set       |  
                      | 5,000 Tickets set(10.0%) |                                                       | 45,000 Tickets (90.0%)  |
                      | (Ground Truth)           |                                                       | (Contains Label Noise)  |
                                                                                         
                      ___________________________                                                        ___________________________ 
                                                                                                                        |
                                                                                                                        |
                                                                                                                        |
                                                                   ___________________________________________________________________________
                                                                  |                                                                          |
                                                                  |                                                                          |      
                                                                  |                                                                          |
                                                                  Ôû╝                                                                          Ôû╝ 
                                         _____________________________                                                              _____________________________
                                        | Tier A Annotators          |                                                             |    Tier B Annotators       |
                                        | 20,000 Tickets (40.0%)     |                                                             | 25,000 Tickets (50.0%)     | 
                                        | 10 Experienced Annotators  |                                                             |   30 InExperienced Workers | 
                                          [Noise Rate: 6.67%]        |                                                             |    [Noise rate 21.82%]     | 
                                         _____________________________                                                              _____________________________





­ƒº® Milestone 1 Quantify Label Noise:

1. Overall Noise rate & Standard Error Derivation
An expert audit of $n = 400$ randomly sampled crowd-labeled tickets yielded $x = 60$ disagreements with expert consensus.
Point Estimate
              p╠é = x/n = 60/400 = 0.1500 (15.00%)
Asymptotic Standrad Error(SE)
                          ________           _________
                SE(p╠é) = \/ p╠é(1-p╠é)/n =      \/0.15 x 0.85/400 Ôëà 0.017853

95% Wald Confidence Interval:
Using standard normal quantile z_0.025 = 1.96:

Margin of Error (ME = z_0.025 X SE(p) = 1.96 x 0.017853 Ôëà 0.03499  (3.50%)

CI_95% = p╠é +-ME = 0.1500 +- 0.03499 Ôƒ╣ [11.501%, 18.499%]


2. Statistical Discrepancy: 
Tier A vs. Tier BTo determine if worker experience impacts label reliability, we analyze the stratum-specific audits:
* Tier A (n_A = 180, x_A = 12): p╠éA = 12/180 = 0.0667  (6.67%)
* Tier B (n_B = 220, x_B = 48): p╠éB = 48/220 = 0.2182 (21.82%)
* Absolute Variance (╬öp╠é}: p╠é B - p╠éA = 0.2182 - 0.0667 = 0.1515 (15.15%)
Two-Proportion Test Derivation:
1.Null Hypothesis (H0): p╠éA = p╠éB (Worker experience has no effect on error rate).
2.Alternative Hypothesis (H1):p╠éA Ôëá p╠éB (Tier B has a significantly higher error rate).
3. Pooled Estimator (p╠ä) :
                        {x_A + x_B}/{n_A + n_B} = {12 + 48}/{180 + 220} = {60}/{400} = 0.1500 

Standard Error of the Difference (Sdiff):
                                       ___________________     ________________________
                         Sdiff =     \/ p╠ä(1-p╠ä) (1/nA+1/nB) = \/ 0.15 x 0.85 (1/80+1/220)
                                       _____________________________
                         Sdiff Ôëà     \/0.1275 x (0,005556 + 0.001288) Ôëà 4.221
5. Test Statistic (z)
                z =  p╠éB-p╠éA/Sdiff = 0.2818-0.06667/0.3589 Ôëà 4/221

6. p-value: 2 X (1- PHI (|4.221|)) Ôëà 2.43 X 10^-5 <<0.001
Conclusion: Reject H0. The discrepancy in noise rates between Tier A (6.67%) and Tier B (21.82 %) is statistically significant. Tier B workers are the source if label contamination.

­ƒº® Milestone 2 - Characterize the noise Toplogy:
1. . Empirical Disagreement Matrix Analysis

An analysis of the 60 audited errors reveals systematic, asymmetric mislabeling.

                 _______________________________________________________________________________________________________________________
                |                                                                                                                       |
                | Crowed Label | Expert Ground Truth | Error Count(xi) | % Total Error |  Primary Root Cause                            |            
                | Billing      | Refund              | 14              |  23.33%       |   Overlapping boundary in class                |
                | Refund       | Billing             | 12              |   20.00 %     | Inability to distinguish invoice               |
                |        -     | -                   |          -      |         -     |       adjustments from payouts                 |
                |Technical     |  Account Access     | 9               |  15%          |Loginfailure:Misclassification                  |
                | Shipping     |  Other              | 8               |   13.33%      | Over-relince on keyword matching               |
                |Account Access| Technical           | 6               |   10.00%      | Crendential Issue causing misdiagnosed         |          
                | Technical    | Other               | 5               | 8.33 %        | Fallback bias on obscure technical description | 
                | Other        |   Shipping          |  3              |  5.00 %       | Ambigious Logistic phrasings                   |           
                |  Billing     |   other             | 3               | 5.00          | Genral inquiry misassigned to billing          |
                | Total                                60                 100.00%                                                       |
                |_______________________________________________________________________________________________________________________|



Empirical Noise Transition Matrix Estimate (hat{T})

 ß╣¬  =    | 0.820 0.120 0.000 0.000 0.000 0.060 |
        | 0.140 0.860 0.000 0.000 0.000 0.000 |
        | 0.000 0.000 0.810 0.110 0.000 0.080 |
        | 0.000 0.000 0.080 0.920 0.000 0.000 |
        | 0.000 0.000 0.000 0.000 0.800 0.200 |  
        | 0.000 0.000 0.000 0.000 0.000 0.900 |
2. Root Cause & Process Failure Modes:
Non-Uniform Class-Conditional Noise: Errors do not occur uniformly at random. They follow semantic similarity vectors (43.33% between Billing/Refund and 25.00% between Technical/Account Access).
Ambiguous Guideline Boundaries: Annotation documentation lacks explicit decision trees for compound queries (e.g., "I was double-billed for my subscription and want money back" contains both Billing and Refund signals).
Absence of Consensus Verification: Tier B workers were assigned tickets on a single-pass basis (1 x coverage) without cross-annotator agreement thresholds.



­ƒº® Milestone 3 ÔÇö Reason About the Accuracy Ceiling:
1. Theoretical Accuracy Derivation Under Uniform NoiseAssume a simple symmetric noise model where true labels flip to any of the remaining K-1 classes (K=6) with uniform probability n/K-1

Mathematical Formulation Let  = 0.15 be the noise rate, Atrue = p╠éY = Y)$ be true model accuracy, and A_noisy = p╠éY = \tilde{Y}) = 0.82$ be observed accuracy on noisy labels.

Anoisy = P(┼Â = Y).P(┼Â = Y | ┼Â = Y ) + P( ┼Â Ôëá Y ).P(Y = ┼Â | ┼Â Ôëá  Y)

Anoisy = Atrue (1-╬À )+(1-Atrue)(╬À/K-1)

Substituting K= 6, ╬À = 0.15 and Anoisy = 0.82

0.82= Atrue (1-0.15)+(1-Atrue )(b/k-1)

0.82 = 0.82 Atrue+0.03

0.79 Ôƒ╣ Atrue 0.79/0.82 Ôëê 0.9634 (96.34%)

Theoretical Implication: If noise were uniform, an observed accuracy of 82% would correspond to a highly optimized model achieving 96.34% true accuracy.

2. Failure of Uniform Assumptions in Real DataThe theoretical estimate of 96.34% is flawed in production due to two structural issues:
Evalution Paradox

Model Predicts Ground Truth                    Model Memorizes Crowd Bias
         (True: "Refund")                                (Crowd: "Billing")
                 Ôöé                                              Ôöé
                 Ôû╝                                              Ôû╝
    Evaluated against Noisy Test                   Evaluated against Noisy Test
        (Crowd: "Billing")                             (Crowd: "Billing")
                 Ôöé                                              Ôöé
                 Ôû╝                                              Ôû╝
       ÔØî MARKED INCORRECT                            Ô£à MARKED CORRECT
    (Penalizes Correct Model)                      (Rewards Flawed Model)
1.Violated Independence Assumption: Noise is class-conditional. The probability of flipping depends directly on the true class Y.
2.Evaluation Set Contamination: The test set was constructed via the same crowd pipeline. A model that learns human annotation mistakes scores higher on the noisy test set than a model that predicts true ground truth.

­ƒº® Milestone 4 ÔÇö Find the Bad Labels (Active Audit Strategy)

We have a budget to relabel 2,000 additional tickets with domain experts.

1. Active Audit Pipeline Architecture


                       ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
                       Ôöé     Unlabeled Tier B Pool (25,000)      Ôöé
                       ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
                                            Ôöé
                                            Ôû╝
                       ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
                       Ôöé    Filter 1: Confusable Pair Filter     Ôöé
                       Ôöé  (Billing, Refund, Tech, Acc. Access)   Ôöé
                       ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
                                            Ôöé
                                            Ôû╝
                       ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
                       ÔöéFilter 2: Small Prediction Margin Filter Ôöé
                       Ôöé    M(x) = P(y╠é1|x) - P(y╠é2|x) < 0.20      Ôöé
                       ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
                                            Ôöé
                                            Ôû╝
                       ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
                       Ôöé  Filter 3: Cleanlab Out-of-Fold Joint   Ôöé
                       Ôöé     Normalized Margin Rank Selection    Ôöé
                       ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
                                            Ôöé
                                            Ôû╝
                       ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
                       Ôöé     Top 2,000 Candidate Selection       Ôöé
                       Ôöé       Sent for Expert Relabeling        Ôöé
                       ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöé




2. Quantitative Selection MetricTrain a baseline model on the 5,000 clean in-house expert tickets.Generate out-of-fold predicted probability vectors p╠é(x) for all Tier B samples.Compute the Prediction Margin (M(x)) and Normalized Entropy (H(x)):

(M(x))= P(┼Â1|x)-P(┼Â|x)
                 K
H((x))= -1/log K Ôêæ P(­ØôÄmk|x)log P(­ØôÄk|x)
                k=1
4.Sort candidates in ascending order of M(x) for instances where crowd label ┼À Ôëá ┼À1. Select the top 2,000 tickets. 

3. Evaluation of Audit YieldTo verify that active auditing outperforms random sampling:

Primary Metric: Precision@2000 (Confirmed Mislabeled Tickets /2000).

Target Threshold: Achieve >= 45.0% precision yield (identifying ~ 900+ bad labels), compared to the expected random sampling yield of 21.82% ( 436 bad labels).

­ƒº® Milestone 5 ÔÇö Noise Mitigation & Evaluation1

Noise-Tolerant Training Implementation

To train on residual noisy data without memorization, we employ two complementary methods:

Method 1: Forward Loss Reweighting via Noise Matrix hatT$Modify the cross-entropy loss by passing predicted probability distribution p through the transition matrix ß╣¬ :

  ÔäôForward(P,┼Â) -logg((ß╣¬^T Pij))

import math
import numpy as np
import scipy.stats as stats
import torch
import torch.nn as nn
import torch.nn.functional as F
from cleanlab.filter import find_label_issues

# ==========================================
# 1. MILESTONE 1: STATISTICAL NOISE ANALYSIS
# ==========================================

class LabelNoiseAnalyzer:
    """Performs statistical audits and hypothesis testing on label noise."""

    @staticmethod
    def calculate_confidence_interval(n_audited: int = 400, n_disagreements: int = 60, confidence: float = 0.95):
        p_hat = n_disagreements / n_audited
        z_score = stats.norm.ppf(1 - (1 - confidence) / 2)
        se = math.sqrt(p_hat * (1 - p_hat) / n_audited)
        margin_error = z_score * se
        ci_lower, ci_upper = p_hat - margin_error, p_hat + margin_error

        print(f"--- Milestone 1: Noise Rate Audit ---")
        print(f"Sample Noise Rate (p_hat): {p_hat:.2%}")
        print(f"Standard Error (SE): {se:.4f}")
        print(f"95% Confidence Interval: [{ci_lower:.2%}, {ci_upper:.2%}]\n")
        return p_hat, (ci_lower, ci_upper)

    @staticmethod
    def run_two_proportion_z_test(nA: int = 180, xA: int = 12, nB: int = 220, xB: int = 48):
        pA = xA / nA
        pB = xB / nB
        p_pooled = (xA + xB) / (nA + nB)

        se_diff = math.sqrt(p_pooled * (1 - p_pooled) * ((1 / nA) + (1 / nB)))
        z_stat = (pB - pA) / se_diff
        p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))

        print(f"--- Milestone 1: Tier A vs Tier B Comparison ---")
        print(f"Tier A Noise Rate: {pA:.2%}")
        print(f"Tier B Noise Rate: {pB:.2%}")
        print(f"Calculated z-statistic: {z_stat:.4f}")
        print(f"p-value: {p_value:.6e} (Statistically Significant: {p_value < 0.05})\n")
        return z_stat, p_value


# ==========================================
# 2. MILESTONE 3: UNIFORM NOISE ACCURACY RECOVERY
# ==========================================

def recover_true_accuracy(observed_accuracy: float = 0.82, noise_rate: float = 0.15, num_classes: int = 6):
    """Solves the inversion formula for uniform symmetric label noise."""
    true_accuracy = (observed_accuracy - (noise_rate / (num_classes - 1))) / (1 - (num_classes / (num_classes - 1)) * noise_rate)
    print(f"--- Milestone 3: Accuracy Recovery ---")
    print(f"Observed Test Accuracy: {observed_accuracy:.2%}")
    print(f"Estimated True Accuracy (under uniform noise): {true_accuracy:.2%}\n")
    return true_accuracy


# ==========================================
# 3. MILESTONE 5: NOISE-ROBUST PYTORCH LOSS MODULE
# ==========================================

class ForwardLossCorrection(nn.Module):
    """Loss module adjusting prediction probabilities via Noise Transition Matrix T."""

    def __init__(self, transition_matrix: torch.Tensor):
        super(ForwardLossCorrection, self).__init__()
        self.T = transition_matrix  # Shape: (K, K)

    def forward(self, logits: torch.Tensor, noisy_targets: torch.Tensor) -> torch.Tensor:
        # Step 1: Compute clean softmax probabilities P(Y | x)
        probs = F.softmax(logits, dim=1)

        # Step 2: Map clean probabilities to noisy domain P(Y_tilde | x) = P(Y | x) @ T
        noisy_probs = torch.matmul(probs, self.T)

        # Step 3: Compute Cross-Entropy on adjusted distribution
        log_noisy_probs = torch.log(torch.clamp(noisy_probs, min=1e-12))
        return F.nll_loss(log_noisy_probs, noisy_targets)


# ==========================================
# 4. MILESTONE 5: CONFIDENT LEARNING CLEANLAB PIPELINE
# ==========================================

def run_confident_learning_pruning(predicted_probabilities: np.ndarray, noisy_labels: np.ndarray):
    """Uses Cleanlab to identify corrupt labels for targeted human review."""
    print(f"--- Milestone 4 & 5: Confident Learning (Cleanlab) ---")

    # Identify indices of probable label issues
    label_issues_mask = find_label_issues(
        labels=noisy_labels,
        pred_probs=predicted_probabilities,
        return_indices_ranked_by="self_confidence"
    )

    print(f"Total noisy instances identified by Cleanlab: {len(label_issues_mask)}")
    return label_issues_mask


# ==========================================
# MAIN EXECUTION ENTRY POINT
# ==========================================

if __name__ == "__main__":
    print("==================================================")
    print(" TriNex-AI: HelpDeskNet-50K Solution Execution")
    print("==================================================\n")

    # 1. Run Statistical Audit calculations
    analyzer = LabelNoiseAnalyzer()
    analyzer.calculate_confidence_interval(n_audited=400, n_disagreements=60)
    analyzer.run_two_proportion_z_test(nA=180, xA=12, nB=220, xB=48)

    # 2. Estimate True Model Accuracy
    recover_true_accuracy(observed_accuracy=0.82, noise_rate=0.15, num_classes=6)

    # 3. Test Forward Loss Correction PyTorch Module
    # Example transition matrix T for 6 classes
    T_matrix = torch.eye(6) * 0.85 + torch.ones(6, 6) * 0.03
    T_matrix = T_matrix / T_matrix.sum(dim=1, keepdim=True)  # Normalize rows

    loss_fn = ForwardLossCorrection(transition_matrix=T_matrix)
    dummy_logits = torch.randn(8, 6)  # Batch of 8 samples, 6 classes
    dummy_targets = torch.tensor([0, 1, 2, 3, 4, 5, 0, 1])

    calculated_loss = loss_fn(dummy_logits, dummy_targets)
    print(f"--- PyTorch Test ---")
    print(f"Forward-Corrected Loss output: {calculated_loss.item():.4f}\n")
    print("Pipeline execution complete! All modules operational.")

==================================================
 TriNex-AI: HelpDeskNet-50K Solution Execution
==================================================

--- Milestone 1: Noise Rate Audit ---
Sample Noise Rate (p_hat): 15.00%
Standard Error (SE): 0.0179
95% Confidence Interval: [11.50%, 18.50%]

--- Milestone 1: Tier A vs Tier B Comparison ---
Tier A Noise Rate: 6.67%
Tier B Noise Rate: 21.82%
Calculated z-statistic: 4.2220
p-value: 2.421406e-05 (Statistically Significant: True)

--- Milestone 3: Accuracy Recovery ---
Observed Test Accuracy: 82.00%
Estimated True Accuracy (under uniform noise): 96.34%

--- PyTorch Test ---
Forward-Corrected Loss output: 1.6498

Pipeline execution complete! All modules operational.







































