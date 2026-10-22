import nbformat as nbf
import sys
import io
import traceback

def run_notebook(nb_path):
    with open(nb_path, "r", encoding="utf-8") as f:
        nb = nbf.read(f, as_version=4)
        
    global_env = {}
    
    for idx, cell in enumerate(nb.cells):
        if cell.cell_type == "code":
            source = cell.source
            old_stdout = sys.stdout
            captured_stdout = io.StringIO()
            sys.stdout = captured_stdout
            error_occured = False
            try:
                exec(source, global_env)
            except Exception as e:
                error_occured = True
                traceback.print_exc()
            finally:
                sys.stdout = old_stdout
                
            stdout_text = captured_stdout.getvalue()
            cell.outputs = []
            if stdout_text:
                cell.outputs.append(nbf.v4.new_output("stream", name="stdout", text=stdout_text))
            if error_occured:
                print(f"Error in cell {idx} of {nb_path}!")
                print(stdout_text)
            cell.execution_count = idx + 1
            
    with open(nb_path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Successfully executed {nb_path}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        run_notebook(p)
